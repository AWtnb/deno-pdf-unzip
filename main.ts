import { parseArgs } from "jsr:@std/cli/parse-args";
import { PDFDocument, PDFPage } from "https://cdn.skypack.dev/pdf-lib?dts";

const withSuffix = (path: string, suffix: string): string => {
    const parts = path.split(".");
    const extension = parts.pop() || "pdf";
    return parts.join(".") + suffix + "." + extension;
};

const extractPages = async (
    path: string,
    even: boolean,
): Promise<number> => {
    const data = await Deno.readFile(path);
    const srcDoc = await PDFDocument.load(data);

    const range = srcDoc.getPageIndices().filter((idx: number) => {
        return even == ((idx + 1) % 2 == 0);
    });

    if (range.length < 1) {
        console.log("invalid range!");
        return 1;
    }

    const outDoc = await PDFDocument.create();
    const pages = await outDoc.copyPages(srcDoc, range);

    pages.forEach((page: PDFPage) => {
        outDoc.addPage(page);
    });
    const bytes = await outDoc.save();
    const suf = even ? "_even" : "_odd";
    const outPath = withSuffix(path, suf);
    await Deno.writeFile(outPath, bytes);
    return 0;
};

const main = async () => {
    const flags = parseArgs(Deno.args, {
        string: ["path"],
        default: {
            path: "",
        },
    });

    const tasks = [
        { even: true },
        { even: false },
    ];

    for (const task of tasks) {
        const result = await extractPages(flags.path, task.even);
        if (result != 0) {
            Deno.exit(result);
        }
    }
};

main();
