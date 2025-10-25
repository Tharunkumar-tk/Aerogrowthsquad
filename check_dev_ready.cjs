#!/usr/bin/env node
/**
 * Pre-development check script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        console.log(`✅ ${description}: ${filePath} (${sizeMB} MB)`);
        return true;
    } else {
        console.log(`❌ ${description}: ${filePath} - NOT FOUND`);
        return false;
    }
}

function checkPythonPackage(packageName) {
    try {
        execSync(`python -c "import ${packageName}"`, { stdio: 'ignore' });
        console.log(`✅ Python package: ${packageName}`);
        return true;
    } catch (error) {
        console.log(`❌ Python package: ${packageName} - NOT INSTALLED`);
        return false;
    }
}

function main() {
    console.log('🔍 Development Environment Check');
    console.log('=' .repeat(40));
    
    let allGood = true;
    
    // Check required files
    const requiredFiles = [
        ['new_plant_health_classifier.h5', 'ML Model'],
        ['create_ml_api.py', 'ML API Script'],
        ['start_ml_dev.py', 'ML Dev Startup Script'],
        ['backend/app.py', 'Backend API'],
        ['src/services/realPlantHealthModel.ts', 'Frontend ML Service']
    ];
    
    console.log('\n📁 Checking Required Files:');
    for (const [file, desc] of requiredFiles) {
        if (!checkFile(file, desc)) {
            allGood = false;
        }
    }
    
    // Check Python packages
    console.log('\n🐍 Checking Python Packages:');
    const pythonPackages = ['flask', 'flask_cors', 'tensorflow', 'PIL', 'numpy'];
    for (const pkg of pythonPackages) {
        const importName = pkg === 'PIL' ? 'PIL' : pkg === 'flask_cors' ? 'flask_cors' : pkg;
        if (!checkPythonPackage(importName)) {
            allGood = false;
        }
    }
    
    // Check Node modules
    console.log('\n📦 Checking Node Dependencies:');
    if (fs.existsSync('node_modules')) {
        console.log('✅ Node modules installed');
    } else {
        console.log('❌ Node modules not installed - run npm install');
        allGood = false;
    }
    
    // Summary
    console.log('\n' + '=' .repeat(40));
    if (allGood) {
        console.log('🎉 All checks passed! Ready for development.');
        console.log('💡 Run: npm run dev');
    } else {
        console.log('⚠️  Some checks failed. Fix the issues above.');
        console.log('💡 Run: npm run setup (to install dependencies)');
    }
    
    process.exit(allGood ? 0 : 1);
}

main();