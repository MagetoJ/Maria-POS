# PowerShell script to deploy Maria Havens POS to Render

Write-Host "🚀 Deploying Maria Havens POS to Render..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a Git repository. Initializing..." -ForegroundColor Red
    git init
    git remote add origin https://github.com/yourusername/maria-havens-pos.git
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Add all changes
Write-Host "📁 Adding all changes..." -ForegroundColor Yellow
git add .

# Commit changes
$commitMessage = "Deploy: Updated database setup with all 12 tables and production SSL support"
Write-Host "💾 Committing changes: $commitMessage" -ForegroundColor Yellow
git commit -m "$commitMessage"

# Push to main branch
Write-Host "🌐 Pushing to main branch..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "🎯 Render should now automatically deploy your changes" -ForegroundColor Cyan
    Write-Host "📊 The new deployment will include:" -ForegroundColor Cyan
    Write-Host "   ✓ All 12 database tables" -ForegroundColor Gray
    Write-Host "   ✓ SSL connection support" -ForegroundColor Gray
    Write-Host "   ✓ Complete sample data" -ForegroundColor Gray
    Write-Host "   ✓ Fixed authentication endpoints" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to push to GitHub: $_" -ForegroundColor Red
    Write-Host "💡 Make sure your GitHub repository is set up correctly" -ForegroundColor Yellow
}

# Instructions
Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Monitor your Render deployment dashboard" -ForegroundColor White
Write-Host "2. Check the build logs for any errors" -ForegroundColor White
Write-Host "3. Once deployed, your app should work with:" -ForegroundColor White
Write-Host "   👤 Admin: admin / admin123 (PIN: 1234)" -ForegroundColor Gray
Write-Host "   👤 Manager: john.manager / manager123 (PIN: 5678)" -ForegroundColor Gray
Write-Host "   👤 Waiter: mary.waiter / waiter123 (PIN: 9012)" -ForegroundColor Gray
Write-Host "   👤 Receptionist: sarah.receptionist / reception123 (PIN: 3456)" -ForegroundColor Gray

Write-Host "`n🎉 Deployment process complete!" -ForegroundColor Green