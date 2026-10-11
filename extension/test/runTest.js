// Test file for the agent-hub-vscode extension
// Tests that the extension can be loaded and basic functions exist

console.log('Running extension tests...');

let extension;
try {
    extension = require('../extension.js');
    console.log('✓ Extension module imported successfully');
} catch (error) {
    console.error('✗ Failed to import extension module:', error);
    process.exit(1);
}

// Test that activate and deactivate functions exist
if (typeof extension.activate === 'function') {
    console.log('✓ activate function exists');
} else {
    console.log('✗ activate function missing or not a function');
    process.exit(1);
}

if (typeof extension.deactivate === 'function') {
    console.log('✓ deactivate function exists');
} else {
    console.log('✗ deactivate function missing or not a function');
    process.exit(1);
}

console.log('All extension tests passed!');