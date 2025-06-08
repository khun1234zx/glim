#!/usr/bin/node
/**
 * Glim: YouTube Video Summarizer
 *
 * Main entry point for the Glim application.
 * Handles command-line arguments and orchestrates the summarization process.
 *
 * @author Bagi
 * @version 1.0.0
 */

import { program } from "commander";
import path from "path";
import readline from "readline";
import { createYouTubeProcessorFlow } from "./flow.js";
import { config, createDefaultConfig } from "./config.js";
import logger from "./utils/logger.js";
import { verifyProviderRequirements } from "./utils/callLLM.js";
import { createPDFfile } from "./utils/pdfConvertor.js";

/**
 * Get user input from the console
 * @param {string} question - Question to display to the user
 * @returns {Promise<string>} User's answer
 */
function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {
    try {
        // Set up command line arguments
        program
            .description(
                "Process a YouTube video to extract topics, questions, and generate ELI5 answers.",
            )
            .option("--url <url>", "YouTube video URL to process")
            .option("--config", "Create default config file")
            .option("--pdf", "Create pdf format from the html")
            .option(
                "--provider <name>",
                "Specify AI provider (google, openai, anthropic, localai)",
            )
            .option(
                "--api-key <key>",
                "Specify API key for the chosen provider",
            )
            .parse();

        const options = program.opts();

        if (options.pdf && !options.url) {
            await createPDFfile();
            process.exit(0);
        }

        // Handle --config option
        if (options.config) {
            logger.info("Creating default configuration file");
            await createDefaultConfig();
            logger.info("Configuration file created successfully");
            process.exit(0);
        }

        // Handle provider selection from command line
        if (options.provider) {
            // Override provider in config
            config.api.provider = options.provider;
        }

        // Handle API key from command line
        if (options.apiKey) {
            // Override API key in config
            config.api.key = options.apiKey;
        }

        // Validate provider requirements
        const provider = config.api?.provider?.toLowerCase();
        if (!(await verifyProviderRequirements(provider))) {
            logger.warn(
                `Issues detected with provider '${provider}'. The application may not function correctly.`,
            );
            // We continue anyway, but with a warning
        }

        // Get YouTube URL from arguments or prompt user
        let inputURL = options.url;
        if (!inputURL) {
            url = await getUserInput("Enter YouTube URL to process: ");
        }

        logger.info(`Starting YouTube content processor for URL: ${inputURL}`);
        logger.info(`Using AI provider: ${provider}`);

        // Create flow
        const flow = createYouTubeProcessorFlow();

        // Initialize shared memory
        const shared = { url: inputURL };

        // Run the flow
        await flow.run(shared);

        // Report success and output file location
        const pdf = options.pdf;
        if (pdf) {
            await createPDFfile();
        }
        console.log("\n" + "=".repeat(50));
        logger.log("Processing completed successfully!");
        logger.log(
            `Output HTML file: ${path.resolve(path.join(process.cwd(), config.output?.filename))}`,
        );
        options.pdf
            ? logger.log(
                  `Output PDF file: ${path.resolve(
                      path.join(
                          process.cwd(),
                          config.output?.filename
                              ?.split(".")
                              .slice(0, -1)
                              .join(".") + ".pdf",
                      ),
                  )}`,
              )
            : null;
        console.log("=".repeat(50) + "\n");

        return 0;
    } catch (error) {
        logger.error(`Error in main function: ${error.message}`);
        logger.error("An error occurred:", error.message);
        return 1;
    }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .then((exitCode) => {
            process.exit(exitCode);
        })
        .catch((error) => {
            logger.error(`Unhandled error: ${error.message}`);
            process.exit(1);
        });
}

export { main };
