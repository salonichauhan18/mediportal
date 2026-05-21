const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'packages', 'ui-core', 'src', 'components');

fs.readdirSync(componentsDir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('@/lib/utils')) {
      content = content.replace(/@\/lib\/utils/g, '../lib/utils');
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${file}`);
    }
  }
});
