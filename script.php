<?php

// Gera um ipv6
function randomIpv6() {
    return '2001:470:8a2f:' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536));
}

// Adiciona o ip a interface do server
function addIpv6($quant = 200) {
  $ipList = [];

  while (count($ipList) < $quant) {
    $ip = randomIpv6();
    $ipList[] = $ip;

    exec("sudo ip addr add {$ip}/48 dev he-ipv6");
  }

  unlink('/etc/squid/ports.conf');
  $file = fopen('/etc/squid/ports.conf', 'a+');

  foreach ($ipList as $index => $ip) {
    $port = substr("8{$index}00", 0, 4);
    $ipList[$index] = ["ip" => $ip, "port" => $port];

    fwrite($file, "http_port {$port} name={$port}
acl tasty{$port} myportname {$port} src all dst ipv6
http_access allow tasty{$port}
tcp_outgoing_address {$ip} tasty{$port}

");
  }

  fclose($file);
  exec("sudo systemctl restart squid");
  echo json_encode($ipList);
}

// Remove ip da interface do servidor
function rmIpv6($ip) {
  exec("sudo ip -6 addr del {$ip}/48 dev he-ipv6");
}

// Reseta proxy
function restartSquid() {
  unlink('/etc/squid/ports.conf');
  $file = fopen('/etc/squid/ports.conf', 'w');
  fwrite($file, "http_port 8080");
  fclose($file);

  exec("sudo systemctl restart squid");
}

// execução via node js
$args = explode(',', $argv[1]);
($args[0])($args[1]);