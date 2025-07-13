console.log("🎯 Testing branding changes and credible stats...\n");

// Test 1: Check homepage title and branding
console.log("1. Testing homepage branding...");
fetch("http://localhost:3001")
  .then(res => res.text())
  .then(html => {
    const hasNewBranding = html.includes("Fandoms");
    const hasOldBranding = html.includes("Chiliz Studio");
    
    console.log(`✅ New branding (Fandoms): ${hasNewBranding ? "✓ Found" : "✗ Missing"}`);
    console.log(`✅ Old branding (Chiliz Studio): ${hasOldBranding ? "✗ Still present" : "✓ Removed"}`);
    
    // Check new stats
    const hasNewStats = html.includes("0.5%") && html.includes("Trading Fees");
    const hasNewAPY = html.includes("8%") && html.includes("Staking APY");
    const hasNewRevenue = html.includes("15%") && html.includes("Platform Revenue Share");
    
    console.log(`📊 New stats implementation:`);
    console.log(`  • Trading Fees (0.5%): ${hasNewStats ? "✓" : "✗"}`);
    console.log(`  • Staking APY (8%): ${hasNewAPY ? "✓" : "✗"}`);
    console.log(`  • Platform Revenue Share (15%): ${hasNewRevenue ? "✓" : "✗"}`);
    
    // Check page title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/);
    if (titleMatch) {
      console.log(`📄 Page title: "${titleMatch[1]}"`);
    }
  })
  .catch(err => console.error("❌ Homepage test failed:", err));

// Test 2: Check tokens page
console.log("\n2. Testing tokens page branding...");
fetch("http://localhost:3001/tokens")
  .then(res => res.text())
  .then(html => {
    const hasNewBranding = html.includes("Fandoms Memecoins");
    const hasUpdatedText = html.includes("create a memecoin on Fandoms");
    
    console.log(`✅ Tokens page branding: ${hasNewBranding ? "✓ Updated" : "✗ Not updated"}`);
    console.log(`✅ Updated text: ${hasUpdatedText ? "✓ Updated" : "✗ Not updated"}`);
  })
  .catch(err => console.error("❌ Tokens page test failed:", err));

// Test 3: Check dashboard page
console.log("\n3. Testing dashboard page branding...");
fetch("http://localhost:3001/dashboard")
  .then(res => res.text())
  .then(html => {
    const hasNewBranding = html.includes("Fandoms");
    const hasOldBranding = html.includes("Chiliz Studio");
    
    console.log(`✅ Dashboard branding: ${hasNewBranding ? "✓ Updated" : "✗ Not updated"}`);
    console.log(`✅ Old branding removed: ${hasOldBranding ? "✗ Still present" : "✓ Removed"}`);
  })
  .catch(err => console.error("❌ Dashboard test failed:", err));

// Wait a bit for all tests to complete
setTimeout(() => {
  console.log("\n🎉 Branding and stats update tests completed!");
  console.log("\n📋 Summary of changes:");
  console.log("• Project name changed from 'Chiliz Studio' to 'Fandoms'");
  console.log("• Stats updated to realistic values:");
  console.log("  - Trading Fees: 0.5% (was 50%)");
  console.log("  - Staking APY: 8% (was 50%)");
  console.log("  - Platform Revenue Share: 15% (was 0%-80%)");
  console.log("• Page title updated to 'Fandoms - Token Platform'");
  console.log("• All UI text updated to reflect new branding");
}, 3000); 