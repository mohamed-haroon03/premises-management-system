$GitPath = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $GitPath)) {
    $GitPath = "git" # Fallback if path is already working
}

& $GitPath init
& $GitPath branch -M main
& $GitPath remote add origin https://github.com/mohamedishaaq216-debug/premises-management-system.git
& $GitPath add .
& $GitPath commit -m "Initial commit for hosting"
& $GitPath push -u origin main
