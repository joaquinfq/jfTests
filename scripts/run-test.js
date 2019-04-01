#!/usr/bin/env node
const jfTestsRunTests = require('../src/RunTests');
const files           = process.argv.slice(2);
if (files.length)
{
    files.forEach(file => new jfTestsRunTests(file).run());
}
else
{
    process.send(
        {
            error   : 5,
            message : 'Se debe especificar el archivo de pruebas'
        }
    );
}
