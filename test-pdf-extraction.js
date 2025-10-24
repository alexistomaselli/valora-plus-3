// Script de prueba para procesar el texto del PDF 7824GSL con IA
import fs from 'fs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Función para procesar texto con OpenAI
async function extractDataWithAI(pdfText) {
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY no está configurada en las variables de entorno');
  }

  const prompt = `
Eres un experto en análisis de documentos de valoración pericial de vehículos. Tu tarea es extraer información específica de un PDF de valoración (Audatex, GT Motive, SilverDAT, etc.) y devolver los datos en formato JSON estructurado.

TEXTO DEL PDF:
${pdfText}

INSTRUCCIONES:
1. Extrae ÚNICAMENTE los datos solicitados
2. Si un dato no está disponible, usa null
3. Para importes monetarios, extrae solo el número (sin símbolos de moneda)
4. Para fechas, usa formato DD/MM/YYYY
5. Para mano de obra, detecta si las unidades son UT o HORAS y convierte UT a horas multiplicando por 0.6
6. Calcula el nivel de confianza basado en la claridad de los datos encontrados

DATOS A EXTRAER:

**DATOS DEL VEHÍCULO:**
- matricula: Matrícula del vehículo
- bastidor: Número de bastidor/chasis (puede aparecer como "NR CHASIS", "NÚMERO CHASIS", etc.)
- fabricante: Marca del vehículo (FORD, KIA, etc.)
- modelo: Modelo del vehículo (PUMA, PICANTO, etc.)
- referencia: Referencia del documento/valoración
- sistema: Sistema de valoración (AUDATEX, GT MOTIVE, SILVERDAT, etc.)
- precio_por_hora_chapa: Precio por hora de mano de obra de chapa/mecánica (busca en sección "Mano de obra")
- precio_por_hora_pintura: Precio por hora de mano de obra de pintura (busca en sección "Pintura")
- fecha_valoracion: Fecha de la valoración

**IMPORTES DE LA ASEGURADORA:**
- total_repuestos: Total de repuestos/piezas
- mo_chapa_ut: Unidades originales de mano de obra chapa (UT o horas tal como aparecen)
- mo_chapa_horas: Horas de mano de obra chapa (convertir UT a horas si es necesario: UT * 0.6)
- mo_chapa_eur: Importe en euros de mano de obra chapa
- mo_pintura_ut: Unidades originales de mano de obra pintura (UT o horas tal como aparecen)
- mo_pintura_horas: Horas de mano de obra pintura (convertir UT a horas si es necesario: UT * 0.6)
- mo_pintura_eur: Importe en euros de mano de obra pintura
- materiales_pintura_eur: Importe de materiales de pintura
- subtotal_sin_iva: Subtotal sin IVA
- porcentaje_iva: Porcentaje de IVA (normalmente 21%)
- monto_iva: Monto del IVA
- total_con_iva: Total con IVA
- unidades_detectadas: Tipo de unidades encontradas ("UT", "HORAS", o "MIXTO")

DEVUELVE ÚNICAMENTE UN JSON CON ESTA ESTRUCTURA:
{
  "vehicleData": {
    "matricula": "string",
    "bastidor": "string",
    "fabricante": "string",
    "modelo": "string",
    "referencia": "string",
    "sistema": "string",
    "precio_por_hora_chapa": number,
    "precio_por_hora_pintura": number,
    "fecha_valoracion": "string"
  },
  "insuranceAmounts": {
    "total_repuestos": number,
    "mo_chapa_ut": number,
    "mo_chapa_horas": number,
    "mo_chapa_eur": number,
    "mo_pintura_ut": number,
    "mo_pintura_horas": number,
    "mo_pintura_eur": number,
    "materiales_pintura_eur": number,
    "subtotal_sin_iva": number,
    "porcentaje_iva": number,
    "monto_iva": number,
    "total_con_iva": number,
    "unidades_detectadas": "string"
  },
  "confidence": number,
  "warnings": ["string"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error de OpenAI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error llamando a OpenAI:', error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    console.log('🔍 Cargando archivo JSON con respuesta de n8n...');
    
    // Leer el archivo JSON
    const jsonContent = fs.readFileSync('./respuesta-n8n-valoracion-7824gsl.json', 'utf8');
    const jsonData = JSON.parse(jsonContent);
    
    console.log('📄 Archivo cargado exitosamente');
    console.log('📄 Longitud del texto:', jsonData.text?.length || 0);
    console.log('📄 Primeros 500 caracteres:', jsonData.text?.substring(0, 500));
    
    if (!jsonData.text) {
      throw new Error('El archivo JSON no contiene el campo "text"');
    }
    
    console.log('\n🤖 Procesando texto con IA...');
    const aiResponse = await extractDataWithAI(jsonData.text);
    
    console.log('\n✅ Respuesta de la IA:');
    console.log(aiResponse);
    
    // Intentar parsear la respuesta
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        console.log('\n📊 Datos extraídos estructurados:');
        console.log(JSON.stringify(parsedData, null, 2));
        
        // Guardar resultado en archivo
        fs.writeFileSync('./resultado-extraccion-7824gsl.json', JSON.stringify(parsedData, null, 2));
        console.log('\n💾 Resultado guardado en: resultado-extraccion-7824gsl.json');
        
        // Mostrar resumen
        console.log('\n📋 RESUMEN DE EXTRACCIÓN:');
        console.log('- Matrícula:', parsedData.vehicleData?.matricula);
        console.log('- Fabricante:', parsedData.vehicleData?.fabricante);
        console.log('- Modelo:', parsedData.vehicleData?.modelo);
        console.log('- Sistema:', parsedData.vehicleData?.sistema);
        console.log('- M.O. Chapa:', parsedData.insuranceAmounts?.mo_chapa_ut, 'UT =', parsedData.insuranceAmounts?.mo_chapa_horas, 'horas');
        console.log('- M.O. Pintura:', parsedData.insuranceAmounts?.mo_pintura_ut, 'UT =', parsedData.insuranceAmounts?.mo_pintura_horas, 'horas');
        console.log('- Unidades detectadas:', parsedData.insuranceAmounts?.unidades_detectadas);
        console.log('- Total con IVA:', parsedData.insuranceAmounts?.total_con_iva, '€');
        console.log('- Confianza:', parsedData.confidence);
        
      } else {
        console.log('❌ No se pudo extraer JSON válido de la respuesta');
      }
    } catch (parseError) {
      console.error('❌ Error parseando respuesta JSON:', parseError);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
main();