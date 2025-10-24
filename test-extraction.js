import OpenAI from 'openai';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

// Simular la respuesta real de n8n
const n8nResponse = {
  "text": "SilverDAT 3\nValoración de reparación \nÚltima modificación: 05/04/2023\nDatos del taller\nEmilio José García Latorre pericialesemiliogarcia@gmail.com\nCalle el Morro N51º 677161401\n04610 Cuevas del Almanzora ( Almería ) Emilio José García Latorre\nTitular\nTratamiento Teléfono privado\nApellidos, Nombre Paschalina Gatsou Email\nCalle / Nº CP / Localidad\nDatos del vehículo\nKia Picanto (SA)(2004->) 1.0 Concept\nNº ID del vehículo KNABJ514AAT875717 Nº valoración 28222454\nMatrícula 7824GSL Nº de encargo EXP000014\nMatriculación 23/12/2009 Código del color\nKilómetros 131350 Color\nEquipamiento de serie\nSistema antibloqueo (ABS), Limpialuneta trasera, Cierre centralizado, Dirección asistida, Airbag lado del conductor, Parachoques color carrocería, Carrocería: 5 puertas,\nElevalunas eléctric. delante, Inmovilizador (electrónico) con Cierre centralizado, Caja de cambios 5-marcha, Motor 1,0 Ltr. - 45 kW CAT, Retrovisor exterior Mec. De inter.\nregulable, ambos, Columna de dirección (Volante) regulable en altura\nEquipamiento opcional\nNºPR Nombre\nLlantas de acero 5x14\nRecambios Fecha tarifa: 01/03/2023\nDVN NºPR Nombre % Descuento Cantidad Precio unidad Precio total\n4131 7155007600 Larguero exterior trasero iz. (pieza usada) 50.0 1 62.48 € 62.48 €\n45612 9210207041 Faro dr. (pieza usada) 60.0 1 193.95 € 193.95 €\n52031 7160107401 Refuerzo pared lateral iz. (pieza usada) 1 0.00 € 0.00 €\n53111 7150307C12 Parte lateral p. iz. (pieza usada) 50.0 1 409.32 € 409.32 €\n55411 9240107510 Luz trasera iz. cpl. (pieza usada) 60.0 1 105.73 € 105.73 €\n61512 5450107350 Brazo oscilante transversal d.dr. (pieza usada) 50.0 1 135.09 € 135.09 €\n63012 5466007200 Amortiguador d.dr. 1 87.75 € 87.75 €\n65000 5770007000 Caja de dirección cpl. 1 280.00 € 280.00 €\n66501 155/70 R13 ..T Neumáticos radiales d.iz. 1 50.00 € 50.00 €\n66502 155/70 R13 ..T Neumáticos radiales d.dr. 1 50.00 € 50.00 €\n76021 155/70 R13 ..T Neumáticos radiales p. iz. 1 50.00 € 50.00 €\n76101 5296007450 Tapacubos rueda p. iz. 1 27.15 € 27.15 €\nMano de obra Precio/hora: 59.48 €\nDVN Posición trabajo Nombre Tiempo (Horas) Precio total\n4131 Mano de obra Sust. larguero exterior trasero iz. (trabajo combinado) 1.2 71.38 €\n54091 Mano de obra D+m bisagra portón trasero iz. (portón trasero desmontado) comprende:\nregular portón trasero\n0.1 5.95 €\n54151 Mano de obra D+m muelle de presión de gas portón trasero iz. (portón trasero desmontado) 0.1 5.95 €\n54210 87160R00 D+m junta del portón trasero 0.3 17.84 €\n45612 92000R00 Sust. faro dr. comprende:\nd+m faro dr.\n0.3 17.84 €\n45612 18600A0R Regular faro 0.3 17.84 €\n52031 Mano de obra Sust. pared lateral chapa interior secc. parcial iz.abj. (trabajo combinado) 0.9 53.53 €\n53111 Mano de obra Sust. parte lateral p. iz. (trabajo combinado) comprende:\nsust. parte lateral p. iz. (secc. parcial sin unión con el techo), sust. parte lateral\nsecc. parcial p. iz. (pieza acodada), sust. parte lateral p. iz. (secc. parcial sin pieza\nacodada)\n7.9 469.89 €\n4335 87700R00 D+m revestimiento del apoyapiés iz. comprende:\nd+m revestimiento de la aleta iz.abj., sust. revestimiento de la aleta iz.abj.\n0.2 11.90 €\n24111 Mano de obra D+m puerta p. iz. comprende:\nregular puerta trasera iz.\n0.3 17.84 €\n25931 81351R00 D+m gancho cierre de la puerta p. iz. comprende:\nregular horquilla de cierre p. iz.\n0.2 11.90 €\n32111 89000R00 D+m asiento del fondo iz. cpl. comprende:\nd+m almohadilla del asiento trasero iz., d+m respaldo del asiento p. iz.\n0.2 11.90 €\n\n34110 85310R00 D+m techo interior comprende:\ndesm.+mont./sust. cristal luz de techo d., d+m parasol iz., sust. parasol iz., d+m\nparasol dr., sust. parasol dr., d+m compartimento para gafas techo interior, sust.\ncompartimento para gafas techo interior, d+m luz de techo d., sust. luz de techo d.,\nsust. asa d.dr., d+m asa p. iz., sust. asa p. iz., d+m asa p.dr., sust. asa p.dr., d+m\nairbag montante a iz., sust. airbag montante a iz., d+m airbag montante a dr., sust.\nairbag montante a dr., d+m revestimiento montante b iz.arr., sust. revestimiento\nmontante b iz.arr., d+m revestimiento montante b dr.arr., sust. revestimiento\nmontante b dr.arr., d+m revestimiento montante c iz., sust. revestimiento montante\nc iz., d+m revestimiento montante c dr., sust. revestimiento montante c dr.\n0.9 53.53 €\n35611 68761R00 D+m revestimiento montante c / paso de rueda p.iz.abj. 0.2 11.90 €\n35911 83110R00 D+m protección de los cantos p. iz. 0.3 17.84 €\n52401 68869R00 D+m revestimiento pared lateral iz. comprende:\nd+m revestimiento montante c iz., sust. revestimiento montante c iz., d+m bandeja\ntrasera, sust. bandeja trasera, d+m red del maletero, sust. red del maletero, d+m\nestera del maletero, sust. estera del maletero, d+m hueco portaobjetos maletero,\nsust. hueco portaobjetos compartimento para equipajes, d+m revestimiento chapa\ntrasera, sust. revestimiento chapa trasera, d+m luces del maletero, sust. luces del\nmaletero, desm.+mont./sust. cristal de la luz luz del maletero, d+m cubierta rueda\nde reserva, sust. reserva tapacubos rueda\n0.3 17.84 €\n53111 Mano de obra Tratar pliegues y costuras parte lateral p. iz. comprende:\nsellar ayuda-n°. elaboración datos piezas de carrocería, tratar pliegues y costuras\nparte lateral p. iz.\n0.7 41.64 €\n53383 Mano de obra D+m guardabarros antes de paso de rueda p. iz. 0.1 5.95 €\n54010 Mano de obra D+m portón trasero comprende:\nregular portón trasero\n0.5 29.74 €\n56701 69510R00 D+m tapa del depósito 0.2 11.90 €\n56760 31030R00 D+m boca de llenado del depósito comprende:\nd+m cubierta del pasarruedas p. iz., sust. cubierta del pasarruedas p. iz.,\ndesm.+mont./sust. tubo flexible boca de llenado del depósito, desm.+mont./sust.\ntapacubos p. iz., desm.+mont./sust. tapa del buje p. iz., d+m rueda p. iz.\n0.5 29.74 €\n57010 86520R00 D+m parachoques p. cpl. 0.3 17.84 €\n55411 92400R00 Sust. luz trasera iz. comprende:\nd+m luz trasera iz.\n0.3 17.84 €\n61512 54509R00 Sust. brazo oscilante transversal dr.abj. comprende:\nd+m brazo oscilante transversal dr.abj., sust. articulación portante d.dr., sust.\ncasquillo del cojinete brazo oscilante transversal dr., sust. cojinete de goma brazo\noscilante transversal d.dr., desm.+mont./sust. tapacubos d.dr., desm.+mont./sust.\ntapa del buje d.dr., d+m rueda d.dr.\n0.4 23.79 €\n63012 Mano de obra Sust. amortiguador d.dr. (rueda desmontado) comprende:\nd+m tubo amortiguador d.dr., desm.+mont./sust. amortiguador de golpes\namortiguador d.dr., desm.+mont./sust. muelle helicoidal d.dr., desm.+mont./sust.\ncaja de resorte d.dr.arr., desm.+mont./sust. cojinete del tubo amortiguador d.dr.,\ndesm.+mont./sust. tapacubos d.dr., desm.+mont./sust. tapa del buje d.dr., d+m\nrueda d.dr.\n0.5 29.74 €\n65000 57700R00 Sust. engranaje de la servodirección comprende:\nd+m engranaje de la servodirección, desm.+mont./sust. manguitos de dirección\namb., sust. manguito de dirección iz., desm.+mont./sust. manguito de dirección\ndr., desm.+mont./sust. tubería de presión caja de dirección, desm.+mont./sust.\nrótula de la barra de dirección amb., desm.+mont./sust. rótula de la barra de\ndirección iz., desm.+mont./sust. rótula de la barra de dirección dr.,\ndesm.+mont./sust. tapacubos d.iz., desm.+mont./sust. tapacubos d.dr.,\ndesm.+mont./sust. tapa del buje d.iz., desm.+mont./sust. tapa del buje d.dr., d+m\nrueda d.iz., d+m rueda d.dr., regular vía, medir vía delantera, evacuar+rellenar\nhidráulico sistema dirección asistida\n1.8 107.06 €\n66534 52910R0B Sust. 3 neumáticos y/o llantas 0.8 47.58 €\n90803 Mano de obra Modificar bancada 1 59.48 €\n97041 Mano de obra Medir+reglar vehículo cpl. (después reparación) comprende:\nmedicion optica vehículo después reparación, medir+reglar vehículo d. (después\nreparación), medir vehículo d. (después reparación), medir+reglar vehículo p.\n(después reparación), regular vía, medir vía delantera\n1.5 89.22 €\n2871 Mano de obra Enderezar lateral del vehículo iz. 3 178.44 €\n43712 Mano de obra Reparar aleta dr. 2.5 148.70 €\n44210 Mano de obra Reparar capó 2 118.96 €\n52511 Mano de obra Reparar chapa final cpl. 5 297.40 €\n54010 Mano de obra Reparar portón trasero comprende:\nreparar portón trasero mit.sup. (mitad sup. cristal), reparar portón trasero mit.inf.\n(mitad inf. cristal)\n2 118.96 €\nPintura EUROLACK - Metalizado (2 Capas) Precio/hora: 59.48 €\nDVN Niveles Nombre Tiempo (Horas) Materiales\nMano de obra Preparación para pintura 1.7\n4131 PIEZA INTERIOR Montante trasero iz. 0.4 6.75 €\n43712 REP. NIVEL 1 Aleta d.dr. 1.1 22.5 €\n44210 REP. NIVEL 1 Capó 1.5 47.25 €\n\n52011 PIEZA INTERIOR Parte lateral inter. p. iz. 0.6 22.5 €\n52511 REP. NIVEL 1 Chapa trasera 1.2 27 €\n53111 PIEZA NUEVA-S Parte lateral p. iz. 2 47.25 €\n54010 REP. NIVEL 1 Portón trasero 1.4 40.5 €\nResumen\nRecambios Mano de obra Pintura\nImporte recambios 1.451,47 € Mano de obra (36.8 h) 2.188,85 € MO Pintura 487,74 €\nPequeño Material (2.00%) 0 € Dto. MO (0%) 0 € Constante MO metal (1.7 h) 101,12 €\nSubtotal recambios 1.451,47 € Total MO 2.188,85 € Constante MO plástico ( h) 0 €\nDto. recambios 483,26 € Subtotal M.O. (9.9 h) 588,86 €\nTotal recambios 968,21 € Descuento MO Pintura (%) 0 €\nTotal mano de obra pintura 588,86 €\nMaterial Pintura 213,75 €\nConstante material metal 6,10 €\nConstante material plástico 0 €\nSubtotal material 219,85 €\nDto. sobre material (%) 0 €\nTotal material 219,85 €\nTotal pintura 808,71 €\nTotal\nFijo franquicia 0 € Total recambios 968,21 € Subtotal (sin dto.) 3.965,77 €\nTotal mano de obra 2.188,85 € Descuento (% ) 0 €\nTotal pintura 808,71 € Base imponible 3.965,78 €\nSubTotal 3.965,77 € IVA (21%) 832,82 €\nTotal 4.798,60 €\nTOTAL (menos franquicia) 4.798,60 €\nLeyenda\n* Entrada manual del usuario (no válido para la columna del\nnombre)\n@ Precio repuesto para pieza alternativa\nCódigo de reparación\nA - desmontar y montar B - Protección de los bajos\nC - Reparación-puntos pintura D - desmontar\nE - sustituir F - montar\nG - cortar H - Purgar aire\nI - Reparar J - Limpiar\nK - Costes deducibles L - Pintura\nM - Desmontadas para pintar N - Otros costes auxiliares\nO - Protección del habitáculo P - Comprobar\nQ - Susituir o renovar R - Riesgo\nS - Instalar T - Prueba técnica\nU - Pintura manual V - Medir\nW - equilibrar X - Destapar (sólo lógica de trabajo)\nY - Completar (sólo lógica de trabajo) Z - Desmontar y montar\n/ - Reparar\n\nFotos\nMatrícula: 7824GSL"
};

async function testExtraction() {
  try {
    console.log('Probando extracción con formato real de n8n...');
    console.log('Texto de n8n (primeros 200 caracteres):', n8nResponse.text.substring(0, 200) + '...');
    
    const prompt = `
Extrae la siguiente información del informe de valoración de reparación de vehículo:

ESQUEMA JSON REQUERIDO:
{
  "vehicle_data": {
    "license_plate": "string",
    "frame_number": "string", 
    "manufacturer": "string",
    "model": "string",
    "reference": "string",
    "system": "string",
    "bodywork_price_per_hour": "number",
    "painting_price_per_hour": "number",
    "valuation_date": "string (formato YYYY-MM-DD)"
  },
  "insurance_amounts": {
    "spare_parts_total": "number",
    "labor_total": "number", 
    "painting_total": "number",
    "total_amount": "number",
    "vat_amount": "number"
  }
}

TEXTO DEL INFORME:
${n8nResponse.text}

Devuelve ÚNICAMENTE el JSON con los datos extraídos. Si algún campo no se encuentra, usa null.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1
    });

    console.log('\n=== RESPUESTA DE LA IA ===');
    console.log(response.choices[0].message.content);
    
    // Intentar parsear el JSON
    try {
      const extractedData = JSON.parse(response.choices[0].message.content);
      console.log('\n=== DATOS EXTRAÍDOS (PARSEADOS) ===');
      console.log(JSON.stringify(extractedData, null, 2));
      
      // Verificar campos clave
      console.log('\n=== VERIFICACIÓN DE CAMPOS CLAVE ===');
      console.log('Matrícula:', extractedData.vehicle_data?.license_plate);
      console.log('Fabricante:', extractedData.vehicle_data?.manufacturer);
      console.log('Modelo:', extractedData.vehicle_data?.model);
      console.log('Total recambios:', extractedData.insurance_amounts?.spare_parts_total);
      console.log('Total mano de obra:', extractedData.insurance_amounts?.labor_total);
      console.log('Total pintura:', extractedData.insurance_amounts?.painting_total);
      console.log('Total general:', extractedData.insurance_amounts?.total_amount);
      console.log('IVA:', extractedData.insurance_amounts?.vat_amount);
      
    } catch (parseError) {
      console.error('Error al parsear JSON:', parseError.message);
      console.log('Respuesta cruda:', response.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('Error en la extracción:', error.message);
  }
}

testExtraction();