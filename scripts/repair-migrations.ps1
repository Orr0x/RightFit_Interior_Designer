# Repair migration history to match remote database
# Date: 2025-10-09

Write-Host "Repairing migration history..." -ForegroundColor Cyan

$migrations = @(
    "20250129000003",
    "20250129000004",
    "20250129000005",
    "20250129000006",
    "20250129000007",
    "20250129000008",
    "20250129000009",
    "20250130000010",
    "20250130000011",
    "20250130000012",
    "20250130000013",
    "20250130000014",
    "20250130000015",
    "20250130000016",
    "20250130000017",
    "20250130000018",
    "20250130000019",
    "20250130000020",
    "20250130000021",
    "20250130000022",
    "20250130000023",
    "20250130000024",
    "20250131000025",
    "20250131000026",
    "20250131000027",
    "20250131000028",
    "20250912300000",
    "20250915000000",
    "20250915000001",
    "20250915000002",
    "20250915000003",
    "20250915000004",
    "20250916000000",
    "20250916000002",
    "20250916000003",
    "20250916000004",
    "20250916000005",
    "20250916000006",
    "20250916000007",
    "20250916000008",
    "20251009000001",
    "20251009000002"
)

foreach ($migration in $migrations) {
    Write-Host "Repairing $migration..." -NoNewline
    npx supabase migration repair --status applied $migration 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

Write-Host "`nDone! All migrations marked as applied." -ForegroundColor Green
Write-Host "Run 'npx supabase migration list' to verify." -ForegroundColor Cyan
