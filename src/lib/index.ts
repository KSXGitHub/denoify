
import { denoifySourceCodeStringFactory } from "./denoifySourceCodeString";
import { transformCodebase } from "./transformCodebase";
import { resolveFactory } from "./resolve";
import * as fs from "fs";
import * as path from "path";

export async function run(
    {
        projectPath,
        srcDirPath = ["src", "lib"]
            .find(name => fs.existsSync(path.join(projectPath, name)))!
    }: {
        projectPath: string;
        srcDirPath?: string;
    }
) {

    const packageJsonParsed = require(path.join(projectPath, "package.json"));

    const { denoifySourceCodeString } = denoifySourceCodeStringFactory(
        resolveFactory({
            projectPath,
            "dependenciesPorts": packageJsonParsed?.deno?.dependenciesPorts ?? {},
            devDependencies: Object.keys(packageJsonParsed?.devDependencies ?? {})
        })
    );

    const tsconfigOutDir = require(path.join(projectPath, "tsconfig.json"))
            .compilerOptions
            .outDir
            ; // ./dist

    const denoDistPath = path.join(
            path.dirname(tsconfigOutDir),
            `deno_${path.basename(tsconfigOutDir)}`
    ); // ./deno_dist

    await transformCodebase({
        "srcDirPath": path.join(projectPath, srcDirPath),
        "destDirPath": path.join(
            projectPath,
            denoDistPath
        ),
        "transformSourceCodeString": ({ extension, sourceCode, fileDirPath }) =>
            /^\.?ts$/i.test(extension) || /^\.?js$/i.test(extension) ?
                denoifySourceCodeString({ sourceCode, fileDirPath })
                :
                Promise.resolve(sourceCode)
    });

    fs.writeFileSync(
        path.join(projectPath, "mod.ts"),
        Buffer.from([
            `//Deno module index, auto generated by denoify\n`,
            `export * from "`,
            "./" + path.join(
                denoDistPath,
                path.relative(
                    tsconfigOutDir,
                    packageJsonParsed.main // ./dist/lib/index.js
                ) // ./lib/index.js
            ) // ./deno_dist/lib/index.js
                .replace(/\.js$/i, ".ts"), // ./deno_dist/lib/index.ts
            `";`
        ].join(""), "utf8")
    );


}

