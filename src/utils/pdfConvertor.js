import puppeteer from "puppeteer";
import url from "url";
import logger from "./logger.js";
import path from "path";
import { config } from "../config.js";

export async function createPDFfile() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const htmlFilePath = path.join(process.cwd(), config.output?.filename);
        const htmlFileUrl = url.pathToFileURL(path.resolve(htmlFilePath)).href;
        await page.goto(htmlFileUrl, { waitUntil: "networkidle0" });
        const filename = config.output?.filename
            ? config.output.filename.split(".").slice(0, -1).join(".") + ".pdf"
            : "output.pdf";
        const outputPath = path.join(process.cwd(), filename);
        await page.pdf({
            path: outputPath,
            format: "A4",
            printBackground: true,
        });
        await browser.close();
        logger.info(`✅ PDF format written to ${filename}`);
    } catch (err) {
        logger.error("❌ Failed to write output file as pdf:", err.message);
    }
}
