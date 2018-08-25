import * as ts from 'typescript'



//---------ts desktop compile program------------------//
function compile(fileNames, options) {
    let program = ts.createProgram(fileNames, options);
    program.emit();
}

export let compileDesktop = () => {
        compile(['src/desktop/main.ts'], {
            noEmitOnError: true, 
            noImplicitAny: true,
            target: ts.ScriptTarget.ESNext, 
            module: ts.ModuleKind.CommonJS,
            outDir: 'dist/desktop'
        })
}
