const fs      = require('fs');
const path    = require('path');
const pkgfile = path.resolve(__dirname, '..', '..', '..', '..', 'package.json');
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
                if (devdep.istanbul)
                {
                    scripts.test = 'istanbul cover --include-all-sources --print both --report html --root src jf-tests';
                }
                else if (devdep.nyc)
                {
                    scripts.test = 'nyc --reporter=text --all --include=src/** jf-tests';
                }
                else
                {
                    scripts.test = 'jf-tests';
                }
                fs.writeFileSync(pkgfile, JSON.stringify(pkg, null, 4));
                console.log('%s\nscripts\n    test\n        %s\n', pkgfile, scripts.test);
            }
        }
    );
}
