<?php

DEFINE("GENERATE_QUANT_IPS", 1300);

function randomIpv6() {
    return '2001:470:8a2f:' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536)) . ':' . dechex(rand(1, 65536));
}

function rmIpv6($ip) {
  exec("sudo ip -6 addr del {$ip}/48 dev he-ipv6");
}

function addIpv6($ip) {
  exec("sudo ip addr add {$ip}/48 dev he-ipv6");
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
  shell_exec("squid reload");
  sleep(1);

  shell_exec("squid");
  sleep(1);
}

function killProcessChrome() {
  shell_exec("sudo killall 'chrome'");
}

// nodejs
$args = explode(',', $argv[1]);
($args[0])($args[1]);