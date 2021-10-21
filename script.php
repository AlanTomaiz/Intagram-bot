<?php

DEFINE("GENERATE_QUANT_IPS", 200);

function randomIpv6() {
    return '2001:470:8a2f:' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536));
}

function rmIpv6($ip) {
  exec("sudo ip addr del {$ip}/48 dev he-ipv6");
}

function addIpv6($ip) {
  exec("sudo ip addr add {$ip}/48 dev he-ipv6");
}

function generatePorts() {
  $ipList = [];

  while (count($ipList) < GENERATE_QUANT_IPS) {
    $ip = randomIpv6();

    // addIpv6($ip);
    $ipList[] = $ip;
  }

  echo json_encode($ipList);
}

// nodejs
$args = explode(',', $argv[1]);
($args[0])($args[1]);