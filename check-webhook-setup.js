#!/usr/bin/env node

/**
 * Webhook Setup Diagnostic Tool
 * Run: node check-webhook-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Clerk Webhook Setup...\n');

let issues = 0;
let warnings = 0;

// Check 1: .env.local exists
console.log('1️⃣ Checking .env.local file...');
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env.local file NOT FOUND!');
  console.log('   📝 Create .env.local in project root');
  issues++;
} else {
  console.log('   ✅ .env.local file exists');
  
  // Check 2: Read env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check 3: CLERK_WEBHOOK_SECRET
  console.log('\n2️⃣ Checking CLERK_WEBHOOK_SECRET...');
  if (!envContent.includes('CLERK_WEBHOOK_SECRET')) {
    console.log('   ❌ CLERK_WEBHOOK_SECRET is MISSING!');
    console.log('   📝 Add: CLERK_WEBHOOK_SECRET=whsec_your_secret_here');
    issues++;
  } else {
    const match = envContent.match(/CLERK_WEBHOOK_SECRET=(.+)/);
    if (match && match[1]) {
      const secret = match[1].trim();
      if (secret.startsWith('whsec_')) {
        console.log('   ✅ CLERK_WEBHOOK_SECRET is set correctly');
      } else if (secret === 'whsec_your_secret_here' || secret === 'your_secret_here') {
        console.log('   ❌ CLERK_WEBHOOK_SECRET is still a placeholder!');
        console.log('   📝 Replace with actual secret from Clerk Dashboard');
        issues++;
      } else {
        console.log('   ⚠️  CLERK_WEBHOOK_SECRET found but doesn\'t start with whsec_');
        console.log('   📝 Verify this is the correct Signing Secret from Clerk');
        warnings++;
      }
    }
  }
  
  // Check 4: SUPABASE_SERVICE_ROLE_KEY
  console.log('\n3️⃣ Checking SUPABASE_SERVICE_ROLE_KEY...');
  if (!envContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY is MISSING!');
    console.log('   📝 Add: SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    issues++;
  } else {
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match && match[1]) {
      const key = match[1].trim();
      if (key.startsWith('eyJ')) {
        console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY is set correctly');
      } else if (key === 'your_service_role_key_here' || key === 'eyJxxx...') {
        console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY is still a placeholder!');
        console.log('   📝 Replace with actual service role key from Supabase');
        issues++;
      } else {
        console.log('   ⚠️  SUPABASE_SERVICE_ROLE_KEY found but doesn\'t start with eyJ');
        console.log('   📝 Make sure this is the SERVICE ROLE key, not anon key');
        warnings++;
      }
    }
  }
  
  // Check 5: Other Clerk keys
  console.log('\n4️⃣ Checking other Clerk keys...');
  if (!envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')) {
    console.log('   ⚠️  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing');
    warnings++;
  } else {
    console.log('   ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY found');
  }
  
  if (!envContent.includes('CLERK_SECRET_KEY')) {
    console.log('   ⚠️  CLERK_SECRET_KEY is missing');
    warnings++;
  } else {
    console.log('   ✅ CLERK_SECRET_KEY found');
  }
}

// Check 6: Webhook route file
console.log('\n5️⃣ Checking webhook route file...');
const routePath = path.join(__dirname, 'app', 'api', 'webhooks', 'clerk', 'route.ts');
if (!fs.existsSync(routePath)) {
  console.log('   ❌ Webhook route file NOT FOUND!');
  console.log('   📝 File should be at: app/api/webhooks/clerk/route.ts');
  issues++;
} else {
  console.log('   ✅ Webhook route file exists');
  
  const routeContent = fs.readFileSync(routePath, 'utf8');
  
  // Check for svix import
  if (routeContent.includes('from "svix"') || routeContent.includes('from \'svix\'')) {
    console.log('   ✅ svix import found');
  } else {
    console.log('   ❌ svix import NOT FOUND!');
    console.log('   📝 Make sure svix package is installed: npm install svix');
    issues++;
  }
  
  // Check for dynamic export
  if (routeContent.includes('export const dynamic')) {
    console.log('   ✅ Dynamic rendering configured');
  } else {
    console.log('   ⚠️  Dynamic rendering not configured');
    warnings++;
  }
}

// Check 7: package.json for svix
console.log('\n6️⃣ Checking svix package...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasSvix = 
    (packageJson.dependencies && packageJson.dependencies.svix) ||
    (packageJson.devDependencies && packageJson.devDependencies.svix);
  
  if (hasSvix) {
    console.log('   ✅ svix package is in package.json');
  } else {
    console.log('   ❌ svix package NOT FOUND in package.json!');
    console.log('   📝 Run: npm install svix');
    issues++;
  }
}

// Final summary
console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));

if (issues === 0 && warnings === 0) {
  console.log('✅ All checks passed! Your webhook setup looks good.');
  console.log('\nNext steps:');
  console.log('1. Make sure ngrok is running: ngrok http 3000');
  console.log('2. Update webhook URL in Clerk Dashboard');
  console.log('3. Restart your dev server: npm run dev');
  console.log('4. Test by signing up a new user\n');
} else {
  if (issues > 0) {
    console.log(`❌ Found ${issues} critical issue(s) - Fix these first!`);
  }
  if (warnings > 0) {
    console.log(`⚠️  Found ${warnings} warning(s) - Should check these too`);
  }
  
  console.log('\n📚 For detailed help, see:');
  console.log('   docs/WEBHOOK_FAILING_FIX.md');
  console.log('   docs/CLERK_TO_SUPABASE_SYNC.md\n');
}

process.exit(issues > 0 ? 1 : 0);
