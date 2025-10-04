<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Definir la ruta del archivo de datos
$dataDir = __DIR__ . '../../data';
$dataFile = $dataDir . '/datos_calendario.json';

// Crear directorio de datos si no existe
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Inicializar archivo de datos si no existe
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode(new stdClass()));
}

// Manejar peticiones GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $data = file_get_contents($dataFile);
        $jsonData = json_decode($data, true);
        
        if ($jsonData === null) {
            $jsonData = [];
        }
        
        echo json_encode($jsonData);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Error al leer datos',
            'message' => $e->getMessage()
        ]);
    }
}

// Manejar peticiones POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Obtener los datos del cuerpo de la petición
        $input = file_get_contents('php://input');
        $datos = json_decode($input, true);
        
        if ($datos === null) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Datos inválidos',
                'message' => 'El JSON proporcionado no es válido'
            ]);
            exit();
        }
        
        // Guardar datos en el archivo
        $jsonString = json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($dataFile, $jsonString);
        
        echo json_encode([
            'success' => true,
            'message' => 'Datos guardados correctamente'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Error al guardar datos',
            'message' => $e->getMessage()
        ]);
    }
}

// Manejar métodos no permitidos
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST', 'OPTIONS'])) {
    http_response_code(405);
    echo json_encode([
        'error' => 'Método no permitido',
        'message' => 'Solo se permiten métodos GET y POST'
    ]);
}
?>