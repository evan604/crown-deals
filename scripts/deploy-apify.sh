#!/bin/bash
# Deploy Crown Deals actor to Apify

echo "🚀 Deploying Crown Deals Actor to Apify..."
cd "$(dirname "$0")/../scrapers/apify-actor"

# Create zip
echo "📦 Creating deployment package..."
zip -r crown-deals-actor.zip \
  main.js \
  package.json \
  .actor/ \
  README.md \
  2>/dev/null || {
    echo "❌ zip command not found. Install with: brew install zip"
    exit 1
  }

echo "✅ Created crown-deals-actor.zip"
echo ""
echo "Next steps:"
echo "1. Go to https://console.apify.com/actors"
echo "2. Click 'Create Actor' → 'Upload from ZIP'"
echo "3. Select crown-deals-actor.zip"
echo "4. Go to Settings → Environment Variables"
echo "5. Add:"
echo "   - SUPABASE_URL=https://huegynfpgsgoqzwrkbzl.supabase.co"
echo "   - SUPABASE_SERVICE_KEY=eyJ... (service_role key)"
echo "6. Save and press 'Run'"
echo ""
echo "Or use Apify CLI (if installed):"
echo "   apify push"
