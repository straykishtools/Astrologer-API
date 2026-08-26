foreach ($port in 8030,8040,8050,8060,8070,8090,9000) {
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
        $listener.Start()
        Write-Output "Port ${port}: FREE"
        $listener.Stop()
    } catch {
        Write-Output "Port ${port}: IN USE"
    } finally {
        if ($listener) { $listener.Stop() }
    }
}
