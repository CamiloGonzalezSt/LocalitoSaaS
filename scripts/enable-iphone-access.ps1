$ErrorActionPreference = "Stop"

Write-Host "Configurando acceso iPhone para Localito..." -ForegroundColor Cyan

netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=5174 | Out-Null
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3001 | Out-Null

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=5174 connectaddress=127.0.0.1 connectport=5173
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3001 connectaddress=127.0.0.1 connectport=3000

netsh advfirewall firewall delete rule name="Localito iPhone Web 5174" | Out-Null
netsh advfirewall firewall delete rule name="Localito iPhone API 3001" | Out-Null

netsh advfirewall firewall add rule name="Localito iPhone Web 5174" dir=in action=allow protocol=TCP localport=5174 profile=private
netsh advfirewall firewall add rule name="Localito iPhone API 3001" dir=in action=allow protocol=TCP localport=3001 profile=private

Write-Host ""
Write-Host "Listo. Abre esta URL en el iPhone:" -ForegroundColor Green
Write-Host "http://192.168.4.85:5174" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para cerrar"
