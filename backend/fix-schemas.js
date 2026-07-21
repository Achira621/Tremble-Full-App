const fs = require('fs');
const path = require('path');
const pkgPath = path.join(__dirname, 'node_modules', '@insforge', 'shared-schemas', 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.exports && pkg.exports['.']) {
    pkg.exports['.'].require = pkg.exports['.'].import;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Patched @insforge/shared-schemas exports!');
  }
}
