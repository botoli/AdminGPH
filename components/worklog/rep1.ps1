$f = 'C:\Users\stand\OneDrive\Desktop\adminGPH\admingph\components\worklog\worklog-table.tsx'
$c = [IO.File]::ReadAllText($f)
$c = $c -replace 'className="flex flex-col gap-4"', 'className={styles.container}'
$c = $c -replace 'className="flex flex-wrap items-center gap-3"', 'className={styles.toolbar}'
$c = $c -replace 'className="w-40"', 'className={styles.dateInput}'
$c = $c -replace 'className="flex-1"', 'className={styles.spacer}'
$c = $c -replace 'className="mr-1\.5 h-3\.5 w-3\.5"', 'className={styles.buttonIcon}'
$c = $c -replace 'className="overflow-x-auto"', 'className={styles.tableWrapper}'
$c = $c -replace 'className="w-full text-sm"', 'className={styles.table}'
$c = $c -replace 'className="border-b border-zinc-200 dark:border-zinc-800"', 'className={styles.theadRow}'
[IO.File]::WriteAllText($f, $c)
Write-Host 'Batch 1 done'
