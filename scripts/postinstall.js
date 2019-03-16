const fs      = require('fs');
const path    = require('path');
const pkgfile = path.resolve('..', '..', '..', 'package.json');
if (fs.existsSync(pkgfile))
{
    process.on(
        'exit',
        () =>
        {
            const pkg     = require(pkgfile);
            const scripts = pkg.scripts || (pkg.scripts = {});
            if (!scripts.test)
            {
                const devdep = pkg.devDependencies || {};
                scripts.test = devdep.istanbul
                    ? 'istanbul cover --include-all-sources --print both --report html --root src node_modules/@jf/tests/src/Runner.js'
                    : 'node node_modules/@jf/tests/src/Runner.js';
                fs.writeFileSync(pkgfile, JSON.stringify(pkg, null, 4));
                console.log('%s\nscripts\n    test\n        %s\n', pkgfile, scripts.test);
            }
        }
    );
}
