// Configura AWS S3
AWS.config.update({
    accessKeyId: 'TU-ACCESS-KEY-ID', 
    secretAccessKey: 'TU-SECRET-ACCESS-KEY',
    sessionToken: 'TU-SESSION-TOKEN',
    region: 'us-east-1'
});

const s3 = new AWS.S3();
const bucketName = 'event-registration-photos';

// Función para subir un archivo
async function subirArchivo() {
    return new Promise((resolve, reject) => {
        const fileInput = document.getElementById('foto');
        const file = fileInput.files[0];
        const params = {
            Bucket: bucketName,
            Key: file.name,
            Body: file,
            ACL: 'public-read',
            ContentType: file.type
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.error('Error subiendo el archivo:', err);
                reject(err);
            } else {
                console.log('Archivo subido con éxito:', data.Location);
                resolve(data.Location); // Resolver la promesa con la URL del archivo subido
            }
        });
    });
}

// Manejar el envío del formulario
document.getElementById('registroForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita el envío del formulario tradicional
    
    const url = await subirArchivo(); // Subir archivo y obtener su URL
    console.log('te encanta ',url);
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const correo = document.getElementById('correo').value;
    const cedula = document.getElementById('cedula').value;

    const data = {
        TableName: "eventregistration",
        Item: {
            nombre: nombre,
            apellido: apellido,
            correo: correo,
            cedula: cedula,
            foto: url // Guardar la URL de la imagen subida en DynamoDB
        }
    };

    fetch('https://pwk6j1yomg.execute-api.us-east-1.amazonaws.com/default/eventRegistration', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Formulario enviado con éxito');
        // Actualizar la lista después de enviar el formulario
        obtenerDatosDynamoDB();
        // Limpiar los campos del formulario
        document.getElementById('registroForm').reset(); // Resetea el formulario
        document.getElementById('foto').value = ''; // Limpia el campo de archivo
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Hubo un error al enviar el formulario');
    });
    
});

// Función para obtener datos de DynamoDB
async function obtenerDatosDynamoDB() {
    try {
        const response = await fetch('https://pwk6j1yomg.execute-api.us-east-1.amazonaws.com/default/eventRegistration?TableName=eventregistration');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data); // Para verificar la respuesta en la consola

        const dataList = document.getElementById('dataList');
        dataList.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos

        if (data.Items.length === 0) {
            const noDataMessage = document.createElement('li');
            noDataMessage.textContent = 'No hay datos disponibles.';
            dataList.appendChild(noDataMessage);
        } else {
            data.Items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `Nombre: ${item.nombre}, Apellido: ${item.apellido}, Correo: ${item.correo}, Cédula: ${item.cedula}, Foto: <a href="${item.foto}" target="_blank">${item.foto}</a>`;
                dataList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error('Error obteniendo datos de DynamoDB:', error);
        const dataList = document.getElementById('dataList');
        dataList.innerHTML = '<li>Error al obtener datos.</li>';
    }
}

// Llamar a la función para cargar los datos cuando la página esté lista
document.addEventListener('DOMContentLoaded', obtenerDatosDynamoDB);
