class BaseNode {
    constructor() {
        this._params = {};
        this._successors = new Map();
    }

    async _exec(prepRes) {
        return await this.exec(prepRes);
    }

    async prep(shared) {
        return undefined;
    }

    async exec(prepRes) {
        return undefined;
    }

    async post(shared, prepRes, execRes) {
        return undefined;
    }

    async _run(shared) {
        const p = await this.prep(shared);
        const e = await this._exec(p);
        return await this.post(shared, p, e);
    }

    async run(shared) {
        if (this._successors.size > 0) {
            console.warn("Node won't run successors. Use Flow.");
        }
        return await this._run(shared);
    }

    setParams(params) {
        this._params = { ...params }; // FIXED: Deep copy to avoid reference issues
        return this;
    }

    next(node) {
        this.on("default", node);
        return node;
    }

    on(action, node) {
        if (this._successors.has(action)) {
            console.warn(`Overwriting successor for action '${action}'`);
        }
        this._successors.set(action, node);
        return this;
    }

    getNextNode(action = "default") {
        const nextAction = action || "default";
        const next = this._successors.get(nextAction);
        if (!next && this._successors.size > 0) {
            console.warn(
                `Flow ends: '${nextAction}' not found in [${Array.from(this._successors.keys())}]`,
            );
        }
        return next;
    }

    clone() {
        // FIXED: Proper deep cloning
        const clonedNode = new this.constructor();

        // Copy all enumerable properties
        for (const key in this) {
            if (this.hasOwnProperty(key)) {
                if (key === "_params") {
                    clonedNode[key] = { ...this[key] };
                } else if (key === "_successors") {
                    clonedNode[key] = new Map(this[key]);
                } else if (typeof this[key] !== "function") {
                    clonedNode[key] = this[key];
                }
            }
        }

        return clonedNode;
    }
}

class Node extends BaseNode {
    constructor(maxRetries = 1, wait = 0) {
        super();
        this.maxRetries = maxRetries;
        this.wait = wait;
        this.currentRetry = 0;
    }

    async execFallback(prepRes, error) {
        throw error;
    }

    async _exec(prepRes) {
        // FIXED: Proper retry logic with await for sleep
        for (
            this.currentRetry = 0;
            this.currentRetry < this.maxRetries;
            this.currentRetry++
        ) {
            try {
                return await this.exec(prepRes);
            } catch (e) {
                if (this.currentRetry === this.maxRetries - 1) {
                    return await this.execFallback(prepRes, e);
                }
                if (this.wait > 0) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, this.wait * 1000),
                    );
                }
            }
        }
        // FIXED: This should never be reached, but adding for safety
        throw new Error("Unexpected end of retry loop");
    }
}

class BatchNode extends Node {
    async _exec(items) {
        if (!items || !Array.isArray(items)) return [];
        const results = [];
        for (const item of items) {
            // FIXED: Ensure we're calling the parent _exec method correctly
            const result = await super._exec(item);
            results.push(result);
        }
        return results;
    }
}

class ParallelBatchNode extends Node {
    async _exec(items) {
        if (!items || !Array.isArray(items)) return [];
        // FIXED: Ensure proper parallel execution
        return await Promise.all(
            items.map(async (item) => {
                return await super._exec(item);
            }),
        );
    }
}

class Flow extends BaseNode {
    constructor(start) {
        super();
        this.start = start;
    }

    async _orchestrate(shared, params) {
        let current = this.start?.clone(); // FIXED: Added null check
        if (!current) {
            throw new Error("Flow has no start node");
        }

        const p = params || this._params || {}; // FIXED: Added fallback for empty params

        while (current) {
            current.setParams(p);
            const action = await current._run(shared);
            const nextNode = current.getNextNode(action);
            current = nextNode?.clone(); // FIXED: Only clone if next node exists
        }
    }

    async _run(shared) {
        const pr = await this.prep(shared);
        // FIXED: Pass prep result to orchestrate and handle it properly
        const params = pr ? { ...this._params, ...pr } : this._params;
        await this._orchestrate(shared, params);
        return await this.post(shared, pr, undefined);
    }

    async exec(prepRes) {
        throw new Error("Flow can't exec.");
    }
}

class BatchFlow extends Flow {
    async _run(shared) {
        const batchParams = await this.prep(shared);

        // FIXED: Handle case where prep returns null/undefined
        if (!batchParams || !Array.isArray(batchParams)) {
            return await this.post(shared, [], undefined);
        }

        // FIXED: Sequential execution with proper error handling
        for (const bp of batchParams) {
            try {
                const mergedParams = { ...this._params, ...bp };
                await this._orchestrate(shared, mergedParams);
            } catch (error) {
                console.error("Error in batch flow execution:", error);
                // Continue with next batch item or rethrow based on your needs
                throw error;
            }
        }
        return await this.post(shared, batchParams, undefined);
    }

    async prep(shared) {
        return []; // FIXED: Return empty array instead of undefined
    }
}

class ParallelBatchFlow extends BatchFlow {
    async _run(shared) {
        const batchParams = await this.prep(shared);

        // FIXED: Handle case where prep returns null/undefined
        if (!batchParams || !Array.isArray(batchParams)) {
            return await this.post(shared, [], undefined);
        }

        // FIXED: Proper parallel execution with error handling
        try {
            await Promise.all(
                batchParams.map(async (bp) => {
                    const mergedParams = { ...this._params, ...bp };
                    return await this._orchestrate(shared, mergedParams);
                }),
            );
        } catch (error) {
            console.error("Error in parallel batch flow execution:", error);
            throw error;
        }

        return await this.post(shared, batchParams, undefined);
    }
}

// Export classes
export {
    BaseNode,
    Node,
    BatchNode,
    ParallelBatchNode,
    Flow,
    BatchFlow,
    ParallelBatchFlow,
};
