<?php

DEFINE("GENERATE_QUANT_IPS", 130);

function randomIpv6() {
    return '2001:470:8a2f:' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536));
}

function rmIpv6($ip) {
  echo exec("sudo ip -6 addr del {$ip}/48 dev he-ipv6");
}

function addIpv6($ip) {
  echo exec("sudo ip addr add {$ip}/48 dev he-ipv6");
}

function generatePorts() {
  $ipList = [];

  while (count($ipList) < GENERATE_QUANT_IPS) {
    $ip = randomIpv6();
    $ipList[] = $ip;

    addIpv6($ip);
  }

  echo json_encode($ipList);
}

function reloadSquid() {
  echo exec("sudo systemctl reload squid");
}

// nodejs
$args = explode(',', $argv[1]);
($args[0])($args[1]);