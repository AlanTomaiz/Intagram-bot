<?php

// nodejs
$args = base64_decode($argv[1]);
$userData = json_decode($args);

echo var_dump($userData->user_id);