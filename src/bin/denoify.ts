#!/usr/bin/env node

import * as commanderStatic from "commander";
import * as path from "path";
import { run } from "../lib/index";

commanderStatic
    .description(`
    A build tool to make node modules written in TypeScript cross compatible with Deno.

    It allow to support deno and all the other JS runtime environnement with a single codebase.

    At this stage of it's development this tools only fix import/export and thus will 
    only works on projects that do not use any node specific API like global, process, "fs", "path" ect...

    You must provide a deno port for each of the dependencies that have not been made cross 
    cross compatible with this module:

    Example: 
        - If your project use: "js-yaml" you can specify the deno port "https://deno.land/x/js_yaml_port/js-yaml.js"
        - If your project use "run-exclusive" you don't have to specify a port as "run-exclusive" has been made cross compatible with this module.

    If you are not the author of a dependency you can fork it on github and denoify it yourself.

    (garronej/denoify) /res/my-module contain an example module with denoify setup.
    You can also have a look at:
    - https://www.npmjs.com/package/evt OR
    - https://www.npmjs.com/package/run_exclusive
    Two package that have been made cross compatible using denoify.

    Here is how a project should be setup to work with denoify:

    package.json:
    {
        "name": "my-module",
        "main": "./dist/lib/index.js",
        ...
        "dependencies": {
            "run-exclusive": "^2.1.6", 
            "js-yaml": "^3.13.1"
        }
        ...
        "deno": {
            //Url to specify so other package using "my-module" can be made cross compatible with denoify.
            "url": "https://deno.land/x/my_module" //Or https://raw.githubusercontent.com/[user/org]/my-module/[commit hash or 'master']/ 
            "dependenciesPorts": {
                "js-yaml": "https://deno.land/x/js_yaml_port/js-yaml.js" 
            }
        },
        ...
        "scripts" {
            "tsc": "npx tsc",
            "denoify": "npx denoify",
            "build": "npm run tsc && npm run denoify"
        },
        ...
        "devDependencies": {
            "denoify": "github:garronej/denoify"
        }
        "files": [ // If you cherry-pick the files included in the npm bundle you must include tsconfig
            "/dist/lib",
            "/src/lib",
            "/tsconfig.json"
        ]

    }

    tsconfig.json:
    {
        ...
        "compilerOptions": {
            ...
            "outDir": "./dist", // Must use the outDir option
            ...
        },
        "filesGlob": [
            "src/**/*"
        ],
        "exclude": [ // Must also use explicit exclude to ignore ts files generated for deno.
            "node_modules",
            "dist/**/*",
            "deno_dist/**/*", 
            "./mod.ts" 
        ]
    }

    When running '$ npm run denoify', './deno_dist' alongside with './mod.ts'
    
    Examples of transformations that will take place from ./src to ./deno_dist

    import { Cat } from "./interfaces/Cat"                      => import { Cat } from "./interfaces/Cat.ts"
    import { Cat } from "./interfaces"                          => import { Cat } from "./interfaces/index.ts"
    import { load } from "js-yaml"                              => import { load } from "https://deno.land/x/js_yaml_port/js-yaml.js"
    import * as runExclusive from "run-exclusive"               => import * as runExclusive from "https://deno.land/x/run_exclusive/mod.js"
    import { build } from "run-exclusive/dist/lib/runExclusive" => import { build } from "https://deno.land/x/run_exclusive/deno_dist/lib/runExclusive.ts"

    The mod.ts file will contain 'export * from "./deno_dist/lib/index.ts";' ( path computed from package.json->main )

    The devDependencies does not necessarily have to be met.
    `)
    .option("-p, --project [projectPath]", `Default: './' -- Denoify the project given to a folder with a 'package.json' and 'tsconfig.json'.`)
    .option("--src [srcDirPath]", `Default: '[projectPath]/src' | '[projectPath]/lib' -- Path to the directory containing the source .ts files.`)
    ;

commanderStatic.parse(process.argv);

run({
    "projectPath": path.resolve(commanderStatic["projectPath"] ?? "."),
    "srcDirPath": commanderStatic["srcDirPath"],
});
