import puppeteer from "puppeteer";
import url from "url";
import logger from "./logger.js";
import path from "path";
import { config } from "../config.js";
import fs from "fs";
import { exit, exitCode } from "process";

export async function createPDFfile(_filename = "YouTube Video Summary") {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        const title = _filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();

        const htmlFilePath = path.join(
            config.output?.dirname || process.cwd(),
            title + ".html",
        );

        if (!fs.existsSync(htmlFilePath)) {
            throw new Error(`HTML file does not exist at: ${htmlFilePath}`);
        }

        const htmlFileUrl = url.pathToFileURL(path.resolve(htmlFilePath)).href;

        await page.goto(htmlFileUrl, { waitUntil: "networkidle0" });

        const filename = title + ".pdf";
        const outputPath = path.resolve(
            path.join(config.output?.dirname, filename),
        );

        await page.pdf({
            path: outputPath,
            format: "A4",
            printBackground: true,
        });

        await browser.close();
        logger.info(`✅ PDF format written to ${outputPath}`);
    } catch (err) {
        logger.error(`❌ Failed to write output file as pdf: ${err.message}`);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const filename =
        "Sundar Pichai CEO of Google and Alphabet  Lex Fridman Podcast #471";
    createPDFfile(filename).then((exitCode) => {
        process.exit(exitCode);
    });
}
