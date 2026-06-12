import { createClient } from '@supabase/supabase-js';

// ==========================================
// CONFIGURACIÓN DE CONEXIÓN A SUPABASE
// ==========================================
const supabaseUrl = 'https://uqrmmotcbnyazmadzfvd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDEyODI2NCwiZXhwIjoyMDg1NzA0MjY0fQ.rcdIczkJN0dnfIL9XoCDgDq4V3Pczl8zrOPPWBC1BRE';

const ESCUELA_ID = '01934d0c-b334-4e6c-8a90-3c1e400c7118'; // Fundación Inter Stars
const SUPER_ADMIN_ID = 'b610f38e-f81c-4b7f-a342-7342a813b11c'; // Frederick Hurtado Rojas

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ==========================================
// DATOS RAW (TSV) PROVISTOS POR EL USUARIO
// ==========================================
const rawTSV = `Ariana	Flores Vasquez	78437951		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Carla	Rojas Roca			Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Claudia Andrea	Hoyos Callejas	75676946		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	50,0
Constanza	Polzella Wehbe	75649399		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	233,3
Fabiana 	Marquez Cespedes			Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Fernanda Micaela	Sandi Seborga	67702996		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Flavia Antonella	Henrich Aguilar	77304072		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Isabella	Abril Porras	69137923		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Jharely 	Sarita Torrico	77609698		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	200,0
Julieta	Anez Tellez	72188398		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Luciana	Luciana  Cronembold	77389988		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Maria Rafaela	Jimenez Canedo	70758058		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Maria Sofia	Ayala Mattia			Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Mariel	Montaño Saucedo	75635705		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Marilin	Sosa Ibarra	61367950		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Maya	Soria Cano	75337007		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	250,0
Michelle	Vaca Ortega	63402453		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	50,0
Miel Stefany	Bruno Muñoz	78353598		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Mishelle	Pereyra Cabrera			Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Nicol Fabiana	Morales Condori	73676947		Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	400,0
Thalia	Rueda Rivero			Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Thiara	Renjifo Cronembold			Roger Romay Jiménez	Santa Clara	17:30	Primera A	Competitivo	0,0
Alexia Kate	Miranda Saracho	69014407		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Anabel Lucero	Mamani	69202043		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	0,0
Anaides	Terrazas Barba	74948049		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Aneliz	Balcazar Aliaga	76319969		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Ariana Katriel	Suarez Lema	70204074		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Arianne	Resse Hurtado	75018934		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Camila	Cirbian Barba	70922628		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Camila	Terceros Wende	77335503		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Carolina Nicol	Terrazas Vias	77610787		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Cesia Fabiana	Heredia	64529850		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	0,0
Daniela	Suarez Coimbra	77623225		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	0,0
Fernanda	Suarez Gonzales	78474904		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Flavia Alissa	Chavez Kepner	76004112		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Isabela Claros	Mendez Roca	70845646		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Isabella	Amaya Cardona	75009797		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Isabella	Moreno Garcia	77047052		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Jimena	Pacheco Velasco	70058529		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Lindsey Giselle	Quispe Santillana	77627676		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	200,0
Luciana	Alvarez Robles	78005897		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	0,0
Luciana Maithe	Taboada Viera	77385843		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Luciana	Saucedo Justiniano	76301888	77859336	David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Maria Julia	Añez Alvarez	76633190		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Maria Regina	Quezada Teodovich	77611811		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	275,0
Maria Renata	Quezada Teodovich	77611811		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	275,0
Maria Victoria	Gallardo Ruiz	76311955		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Micaela	Suarez Rapp	75020606		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	0,0
Monica	Franco Castedo			David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	300,0
Naomi	Viruez Cuellar	63477148		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	100,0
Noelia Simone	Paredes	70857379		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	300,0
Rafaela	Guzman Chopita	76795544		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Rafaella	Baeny	76006410		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Roma Isabella	Rocha Eguez	69278478		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Sofia	Polzella Wehbe	75649399		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	233,3
Sofia	Suarez Pinto	78005088		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Tanira	Mendez Ayala	73620608		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	0,0
Valentina	Ibañez Rodriguez	77612312		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Formativo	350,0
Valeria	Amusquivar Eguez	77005108		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Victoria	Cabellero Cordova	78567967		David Camacho Mendoza	Florida	15:30	Sub 16 Fem	Competitivo	400,0
Adriana	Rivero Rivero	62389244		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	0,0
Aitana	Vaca	70833970		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	350,0
Amira	Arancibia Lopez	77313034		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Amy Esther	Viana Arteaga	72612909		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	200,0
Anette	Cuellar	76853534		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Brianna	Barja	75019793		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Diana Sofia	Henrich Hinojosa	72141769		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Elena Lucia	Tejerina Duran	73107743		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Emma	Gil Claure	75004441		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Estefani	Ramos Vargas	78060495		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	88,0
Fabiana	Sosa Escobar	75628505		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	300,0
Francesca	Ferrara Justiniano	77393540		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Francesca	Viscarra Nacif	77433166		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Izumi	Villegas Teruya	78561026		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Katalina	Encinas	75576056		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	160,0
Liz Aramis	Luizaga Orellana	79918799		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Lourdes	Hurtado Crespo	62698070		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	400,0
Luana	Nuñez Vargas	63485495		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Lucia	Ayala Mendez	77654542		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Lucia Patricia	Justiniano Poehlman	76005866		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Maria Belen	Gonzales Barrero	76354100		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Maria Isabel	Parada	70080999		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Maria Valentina	Saavedra Padilla	70063463		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Maria Victoria	Daga Dorado	78564103		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Marlene	Olazabal Natusch	72189212		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Martina	Cisneros Fernandez	77572762		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	300,0
Massiel	Zurita Barja	77666868		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Mia	Cervantes Galvao	78443310		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Mia Julieth	Oquendo Fierro	75021375		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	160,0
Mikaela	Subieta Peñaloza	60961171		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Natalia	Acosta	78438238		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Natalia	Arce Barron	73442424		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Nazarena	Antelo Cronembold	78499555		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Nicole	Polo Raful	67707208		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Nicole	Ribera Rivero	60095397		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Nicole	Sanchez	70881040		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Olivia	Parada Leaños	77760162		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Paula Andrea	Terrazas Barba	74948049		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Renata	Mostajo Barba	75059187		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Sofia	Rodriguez Campos	74636615		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Thais	Zeballos Echeverria	75555983		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Thiara	Soto Salces	71628885		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Formativo	350,0
Valentina Alexandra	Galindo Patiño	76670705		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Valentina	Nostas Roca	71621036		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Valeria	Sanchez Osinaga	75505152		Roger Romay Jiménez	Santa Clara	16:00	Sub 14 Fem	Competitivo	400,0
Agustina	Leaños Duran	78046065		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	350,0
Alessandra	Frerking	77300109		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	350,0
Ana Catalina	Cespedes Justiniano	75504808		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Anette	Frerking Velasco	7710108		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	350,0
Ariana	Aparicio	78437951		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	200,0
Catalina	Saucedo  	76849231		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Dahize	Escobar Bianco	62510508		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	0,0
Daniela	Neyrot Otero	72130038		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	350,0
Dasha	Ibarra Cabrera	74697771		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	0,0
Dominique	Tavolara Barrientos	67805136		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	0,0
Emili	Calvimontes	68940346		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	50,0
Jetzel Nicole	Chura Bilbao	71008886		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	350,0
Leticia	Delius Moreno	78017882		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	350,0
Luciana	Menacho Alvarez	77833298		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	200,0
Maria Jose	Paz Ruiz	72692584		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Martina	Pfeifer Gutierrez	78187192		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Natalia	Subieta Nuyttens	70077718		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Rafaela	Campoy	70445999		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	200,0
Sara	Paz	75666965		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	100,0
Sofia	Martinez	17033446967		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	0,0
Sofia Rebeca	Cuellar Wills	79895081		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Sofia	Sanchez Sanchez	75007024		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Formativo	350,0
Victoria	Vaca Diez Stelzer	71000207		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	400,0
Violetta Catalina	Molina Rojas	75554123		Celene Landívar Arauz	Santa Clara	16:00	Sub 12 Fem	Competitivo	300,0
Alexandra	Mendez Almaraz	78080229		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Antonella	Flores Dominguez	77008161		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Bruna Sofia	Dorado	77719198		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Camila Antonella	Ampuero Flores	75324888		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Catalina	Landivar Eguez	76002120		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Elena	Gonzales	73143848		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Isabella	Velasquez	76333001		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Julieta	Frerking	77300109		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Kendall Andere	Mejia Saucedo	72677111		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	0,0
Lara	Gonzales	73143848		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Leonor	Ali Gonzales 	5,95983E+11		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Lucia Kelly	Quintana	67898515		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Maelia Francisca	Chavez	691143984		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	200,0
Maria Nazareth	Jordan Lobo	76090710		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	0,0
Mia Luciana	Sandoval Terrazas	70904111		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Nadira	Corrales Machua	68654550		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Naomi	Yara			Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Nazarena	Viera	67837318		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Olivia	Strauss	70832154		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	250,0
Rafaela	Vaca	77028497		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Renata	Baro Vitte	77600010		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	350,0
Sara	Sosa Escobar	76852466		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Competitivo	200,0
Sofia	Strauss	70832154		Maria Fernanda Guzman Coronel	Santa Clara	17:15	Sub 10 Fem	Formativo	250,0
Alejandro	Montero	72103340		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	310,0
Alexander	Velasquez	62109641		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Andres	Montero	72103340		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	310,0
Arturo	Orellana Ferrufino	67708393		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Bismarck	Yubanure Campi	74933416		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	0,0
Bruno	Limpias	69245403		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Camilo	Pinto Garcia	78058652		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	250,0
Carlos Marcelo	Hurtado Rivera	67509675		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Christopher A.	Rivero Garcia	71062953		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Cristobal	Calaña	76002163		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	220,0
Daniel Matias	Cortez Rivera	75111961		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Daniel	Pally Cabrera	76629063		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	350,0
Diego Alejandro	Flores Rivera	77886111		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	400,0
Diego Andres	Prest Rivera	7007229		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Diego Fabricio	Reynaga Rivera	76641629		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Edgar Matias	Martinez Rivera	70036664		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	350,0
Emiliano	Paz	75666965		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Felipe	Ibanez Cusicanqui	77800056		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Fernando	Salazar Bascope	70828248		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	250,0
Fernando	Senzano Gongora	75559948		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Fernando	Tomasi Tosube	75572628		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Ian Mishael	Panoso Rivera	75673772		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Jamir Benjamin	Aguilera Rivera	73142842		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Javier	Gil			Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Jhordi	Perez			Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	300,0
Joan Alejandro	Robles Maldonado	77302086		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Johans	Ramirez	74688201		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	0,0
Jorge Andres	Rea Rivera	75512352		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	300,0
Jose Alfredo	Jimenez Rivera			Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Jose Santiago	Gaithe Rivera	78143261		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	350,0
Juan Israel	Olivera Rivera	74659269		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Julio Alberto	Mendez Castedo	76607877		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Kevin Efrain	Chinchilla Flores	75599684		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Leonardo	Crapuzzi Suarez	77659250		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Limber Federer	Arteaga Rivera	75389115		Cristian Romay Jiménez	Florida	15:30	Sub 17	Formativo	400,0
Loed	Sesa Camargo	79114071		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	0,0
Lucas Diogo	Zerda Rivera	77605908		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Marcelo	Lozada Vaca	71355978		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Mateo	Torres Roca	77800231		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Matias Francisco	Duran Rivera	72157956		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Matias	Wolf			Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Mediel	Huayhua Brito	70042543		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Miguel	Velasquez Landivar	69195605		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Mirko	Avila Rivera	75503430		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Misael Emanuel	Porcel Rivera	69076635		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Nelson Daniel	Nuñez Rivera	73469267		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Nicolas Facundo	Lino Rivera	75518845		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Nicolas	Oliva Nuñez	77654647		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	350,0
Noah	Montaño	75699000		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Pablo	Farfan Espinoza	76998737		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Roberto	Rojas Torrico	72156884		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Ronal	Gutierrez Mamani	71274264		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	200,0
Samuel	Cardozo Yepez	76681069		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Santiago	Guarachi Aguilar			Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Victor Alejandro	Bautista Rivera	75563293		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Victor Eduardo	Marquez Rivera	69812394		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	400,0
Yohans	Ramirez Dominguez	74688201		Cristian Romay Jiménez	Florida	15:30	Sub 17	Competitivo	0,0
Andres Eduardo	Galdos Ferrufino	67877776		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Angel	Daza Rivero	78009242		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Angel Jhoel	Corrales Machua	67780847		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Brayan Fabricio	Ibañez Quisbert	79878504		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Brayan	Guarena Ascuy	69270417		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	0,0
Caleb	Caleb Vergara	71929269		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	88,0
Carlos Eduardo	Suarez Mendieta	76866246		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	200,0
Donato Evan	Ribera Guzman	72610569		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Eddy Andres	Lamas Marquez	76047806		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Eliel	Moncada Chavez	76347605		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	100,0
Emiliano Luis	Padilha Solares	77339294		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Erick Matias	Menacho Camacho	73690522		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	300,0
Facundo	Huguenet Monje	78490037		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Francisco	Urey Ciancaglini	77610486		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Jadiel Samir	Moruco Rojas	76681988		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	0,0
Jesus Daniel	Porras Giesse	76009506		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Jose Danilo	Moreno Mayan	65001579		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	300,0
Jose Tobias	Tobias Alvarez	76844401		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Juan Pablo	Diez Cabrera	5331439		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Julio Isael	Suarez Coimbrra	77623225		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	0,0
Leonardo	Justiniano Burgos	70874764		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Leonardo Mateo	Ruiz Gonzales	76370079		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Leonardo	Leonardo Morales	76336000		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	350,0
Leonardo	Yubanure Campi	74933413		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	0,0
Lucas	Lucas Zampiery	76670405		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Manuel	Diaz Camacho	785228095		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Marco	Farfan Espinoza	70998737		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Matias Franco	Suarez Parraga	79034793		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	350,0
Matias	Nozato Zeballos	77888988		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Mauricio	Campos Dominguez	75012914		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Miguel	Mujia Fuentes	72085576		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Napo	Tarabillo Vega	76006230		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Nicolas	Pereyra Roda	75010846		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Rafael	Duran Moreno	77377277		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Ric Emerson	Castedo Vera	62182849		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Ronald Andre	Callejas Urquiza	75004420		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Salvador	Salvador Ameri			Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Samuel	Landivar Prudencio	72123341		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Santiago	Arauz Callau	70932828		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Santiago	Beyuma Crespo	77360237		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Santiago	Chavez Eguez	75554123		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	0,0
Santiago	Correa Morales	75301002		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Santiago	Santiago Medina	77057652		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Santiago	Morales Hurtado	60934666		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Santiago Ulices	Vargas Limachi	75540773		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	200,0
Sebastian Andree	Cardozo Cardozo	67401191		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	200,0
Sebastian	Mendez Tomelick	75069018		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Sebastian	Roda Jimenez	72646673		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Sergio	Sergio Melgar	73629291		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Thiago Jose	Tapia Ovando	70933533		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	350,0
Thiago	Thiago Martinez	77000375		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Formativo	400,0
Thiago	Pareja Fernandez	76688880		Víctor Andrés Zeballos Heredia	Santa Clara	17:30	Sub 15	Competitivo	400,0
Alexandre	Oliveira Contreras	72182371		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Angel Mateo	Saavedra Cabrera	71029299		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Bruno	Belaunde Montenegro	68923752-68923750		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Bryan Alex	Peña Nuñez	75396825		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
David	Antelo Salazar	76891032		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
David Nicolas	Urquiza Meyer	75369809		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	0,0
Dhenzel	Añez			Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	90,0
Emiliano	Chavez Molina	77371020		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Emiliano	Crapuzzi Suarez	77659250		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Francisco Mateo	Vedia Olmos	70007481		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Franco Cabrera	Cabrera Knazuerhase	78583700		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Franco	Flores Ribera	77030073		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Franco Ryuki	Cerezo Oyakawa	76086246		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	110,0
Hans Danilo	Larrain Vargas	70716061		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Jim Patrick	Candia Bedia	71013393		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	200,0
Jose Andres	Andres Moye	75584081		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	0,0
Jose Luis	Soliz Aguilera	61374151		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	200,0
Jose Maria	Bullain Padilla	60998600		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	0,0
Leonardo	Sarmiento Roca	71499983		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Lucas Omar	Roda Mendoza	73382762		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Lucas	Vaca Pereira	77337877		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Lucas Yadiel	Cinco Zuñiga	79042155		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Luis Daniel	Vallejos Aguilera	79023547		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Mateo	Montaño	68770120		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Mateo	Villarroel Noé	75013138		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Mathias	Salvatierra	74183010		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Matias	Salinas Torrez	73620125		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Matias 	Salvatierra Sulzer	79878252		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Miguel Alejandro	Peinado Aranibar	71331696		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Milthon Omar	Vaca Inturias	75011106		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Nicolas	Nuñez Chavez			Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	0,0
Nicolas	Vargas Chumacero	72669545		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	0,0
Ruben Dario	Roman Cuellar	77666606		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Samuel	Boutier Bruno	77030381		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Santiago	Alvarez Forest	70400877		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Santiago	Iraipi Cuellar	78123624		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Santiago Isael	Bloomfield Medrano	69327388		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Santiago	Justiano Vaca	70819090		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Santiago	Porco Rocha	76640325		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Sebastian	Salvatierra Hurtado	75668128		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Sergio Alejandro	Castillo Rojas	70844119		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	300,0
Stephen	Castro Hurtado	77307550		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Tiago Alejandro	Yañez Martinez	77000916		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Tobias	Kahler Ramirez	78793051		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Victor Hugo	Romero Pereyra	78550177		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Formativo	350,0
Victor Manuel	Bejarano Clavijo	70711722		Marco Antonio Saavedra Alvarez	Liga del Norte	17:00	Sub 14	Competitivo	400,0
Adrian	Iturri Reinaga	78852700		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Amir	Abularach Chavez	79876236		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Andre	Galviz	70042309		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Formativo	170,0
Andres	Campos Molina	75129376		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Andres	Rioja			Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Andres Yakov	Rioja Rodriguez	77336883		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Bastian	Jimenez Escobar	65055353		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Bruno	Eguez Rueda	73105604		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Bruno	Vargas Limachi	75540773		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	200,0
Carlos Andres	Anez Roca	70853070		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Carlos Andres	Paz Ribera	78001258		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	0,0
Carlos Sergio	Lozano	77074708		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Carmelo	Franco Pereira	78459845		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Claudio Samuel	Chavez Suarez	78500580		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Darwin	Vargas Choquevique	75076000		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	100,0
David	Pereyra Bravo	76016135		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	250,0
Emiliano	Alvis Urquieta	62011216		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Emiliano	Quiroz Martinez	70084277		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	140,0
Estefano	Moreno Castedo	63532792		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Ezequiel	Paez Ibañez	78181209		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	100,0
Fabricio	Griffiths Languidey	75557776		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Felipe	Noguera Zurita	68837560		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	300,0
Fernando	Yañez Ruiz	71039941		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	120,0
Francesco	Polzella	75649399		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	233,3
Francisco Alejandro	Luna Sandoval	78441482		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Franco	Dilillo	75031441		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Formativo	0,0
Franco	Suarez Centellas	76323099		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Giovanni	Peña Salvatierra	77620827		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Henry Arvin	Piza Pantoja	71008408		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Javier Santiago	Trujillo Terceros	70798978		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Jelrik	Dangiers	69219946		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Jose Eduardo	Revollo Lazo	78950269		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Leonardo	Carrasco	78520910		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Leonardo	Eguez Figueroa	78198555		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Leonardo	Limpias Bruno	78567510		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Lucas	Pessoa Suarez	77502801		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	200,0
Lucas	Rafael Velasquez	69195605		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Luciano	Eid Aguilera	76666016		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Luciano Mendez	Roca Caleizes			Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Mark Alejandro	Halbeisan Paz	78505078		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Maximiliano	Lijeron	77068222		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Formativo	300,0
Moises	Vaca Diez Cabrera	78526185		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Said Yadiel	Siles Duran	69089545		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	150,0
Samuel	Mustafa	78440454		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	150,0
Santiago	Benjamin Merida	72288662		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Sebastian Mauricio	Martinez Challapa	77373390		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	400,0
Thiago Adrian	Zurita Tordoya	67847445		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Competitivo	200,0
Zamir	Hurtado Hoyos	78457558		Cristian Romay Jiménez	Liga del Norte	17:00	Sub 13	Formativo	350,0
Agustin	Silva Hurtado	78003302		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Alejandro	Jimenez Chavez	71640826		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Arturo	Segales Gutierrez	77452267		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	110,0
Benjamin	Davila Arrazola	77130923		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	245,0
Constantino	Cogigliola	78500809		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Esteban	Justiniano	77387870		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Leonardo	Campos Saunas	70819510		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Neymar	Calvimontes Ceron	68940346		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	0,0
Nicolas	Pacheco Añez	69064281		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Nicolas	Perez Valenzuela	78048000		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Nicolas	Sonaglia			Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	245,0
Sebastian Mateo	Paredes Salazar	76055704		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Sebastian	Rocha Eguez	69278478		Roberto Rodolfo Orihuela Parada	Florida	17:30	Sub 13 Esc	Formativo	350,0
Aaron	Arauz	75621414		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	0,0
Alexandro	Saucedo Beltran	71309089		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	170,0
Hugo Antonio	Antezana	75524042		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	0,0
Isabella Aimé	Montenegro	72677111		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	0,0
Jaime Marcelo	Zelaya	70874148		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	0,0
Jaspe Alexandre	De Oliveira	77166026		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	350,0
Kamel Gael	Saucedo Guareca	77000188		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	170,0
Liam Mateo	Botta Canido	75050709		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	170,0
Nicolas	Castedo Vasquez	76341494		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	0,0
Nicolas	Chumacero	72669545		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	0,0
Oscar Mario	Justiniano Mendez	75524042		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	170,0
Thiago Chavez	Vaca Pereira	71329028		Roberto Rodolfo Orihuela Parada	Santa Clara	09:00	Turno Mañana	Formativo	170,0
Agustin Franco	Agustin	78459845		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Alejandro	Segales Gutierrez	77452267		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Benjamin	Kaiper Vadiillo	76008850		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Bruno Fabrizzio	Todesco	75753731		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	0,0
Carlos Gabriel	Flores	78059939		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Damian	Franco Turra	78009237		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
David	Chavez Roca	7843397		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
David	Viveros Chavez	77096907		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Diego Andre	Iturralde Bazan	72612176		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Dorian	Pereira Soto	77040006		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Elias	Mustafa Viscarra	77433166		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Emiliano	Pizarro Herrera	72660076		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Emiliano	Valdez Mercado	70042426		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Enrique	Montenegro Chavez	70099916		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Enzo	Vaca Añez			Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Franco Salomon	Terrazas Landa	75565656		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Felipe	Garcia Rocha	74660043		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Francisco Elvis	Nueñez Vargas	63485495		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Francisco	Mendez	77311117		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Frederick	Paz Justiniano	8000517		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Ignacio Alejandro	Lavadenz	70727207		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Jorge Nassir	Sapag Salinas	77671414		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	245,0
Josue Fabricio	Crapuzzi	78147037		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Leonardo	Cadena Ortiz	70491744		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Leonardo Emanuel	Oblitas Montesinos	68750225		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Luca	Hochhauser Calderon	76761379		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Lucas Gabriel	Pereira Benitez	59599409472		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Mariano	Cuellar	78564440		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Martin	Moreno Valdivia	77800298		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Mateo	Mendez Roca	70845646		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Maximiliano	Torrico	72137776		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Nicolas	Ibañez Peña	72626215		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Noah	Beltran Perez	72162657		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Oliver	Viera Anez	74604432		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Rafael	Moreno Guillen	76311191		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Raul Fabian	Llanqui Cano	72649730		Yohan Cervantes	Santa Clara	16:30	Sub 11	Formativo	350,0
Ricardo	Bilbao la Vieja Mendez	77330899		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Robert David	Vaca Antelo	75353537		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Sair	Melgarejo Borda	78535442		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Santiago	Rosas Velez	76369201		Yohan Cervantes	Santa Clara	16:30	Sub 11	Competitivo	400,0
Andres	Flores Carrasco	76070658		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	0,0
Angel	Peinado	67985696		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	350,0
Antonio	Chavez	7843397		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Competitivo	400,0
Daniel	Calvimonte	68940346		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	0,0
Dario Andree	Chavez Uriarte	69454936		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	350,0
Gael Isaias	Alegre Melgar	78063474		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	0,0
Ian Pietro	Pictor Rocha	78087387		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	0,0
Luca	Gonzales Quint	72091455		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	350,0
Lucas Dylan	Chura Bilbao	71008886		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	350,0
Luis Mateo	Arias	78188899		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	350,0
Rafael	Saavedra Cabrera	71029299		Vanesa Libertad Paz Peña	Santa Clara	16:00	Sub 9	Formativo	350,0
Aaron	Pedraza Vargas	75388899		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	50,0
Alex Gary	Villaviicencio Gomez	78008869		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Andres	Saucedo Justiniano	77859336		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Damian Jesus	Moscoso Daza	68808927		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Dariana	Escobar Blanco	62510508		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	100,0
Emiliano	Saucedo Morales	76849231		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Guillermo	Camacho Agulera	76017978		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	205,0
Juliana	Velasco Feeney	71349649		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Malik	Quinteros Paz	78505078		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Matias	Pereira Rosales	76337256		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Noah	Aspiazu Ovando	76346900		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Rafael	Pizarro	63434508		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Samuel	Vaca Silva	75306969		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	0,0
Santiago	Zurita	77666868		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	350,0
Selim Eduardo	Sapag Salinas	77671414		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	245,0
Vicente	Camacho Aguilera	76017978		Harper Bier	Santa Clara	16:00	Sub 7	Formativo	205,0`;

// ==========================================
// FUNCIONES AUXILIARES DE FORMATEO
// ==========================================
function cleanName(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanPhone(phone) {
    if (!phone) return null;
    const clean = phone.toString().replace(/\D/g, '');
    if (clean.length === 0) return null;
    if (clean.length === 8) return `591${clean}`;
    return clean;
}

function parseMensualidad(val) {
    if (!val) return 0;
    // E.g. "400,0" -> replace "," with "."
    const clean = val.replace(',', '.').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
}

function calcularFechaNacimiento(grupo) {
    const currentYear = 2026;
    const normalized = grupo.toLowerCase().trim();
    
    // Buscar patrones como "sub 16", "sub16", etc.
    const match = normalized.match(/sub\s*(\d+)/);
    if (match) {
        const age = parseInt(match[1], 10);
        const birthYear = currentYear - age;
        return `${birthYear}-01-01`;
    }
    
    // Si no contiene "sub", asumimos categoría general (20 años por defecto)
    return "2006-01-01";
}

// Caches de dependencias para evitar escrituras y consultas duplicadas
const sucursalesCache = {};
const canchasCache = {};
const horariosCache = {};

async function resolverSucursal(nombre, escuelaId) {
    const key = nombre.trim();
    if (sucursalesCache[key]) return sucursalesCache[key];

    // Buscar en la base de datos
    const { data, error } = await supabase
        .from('sucursales')
        .select('id')
        .eq('nombre', key)
        .eq('escuela_id', escuelaId)
        .maybeSingle();

    if (error) {
        console.error(`Error al buscar sucursal "${key}":`, error.message);
        throw error;
    }
    if (data) {
        sucursalesCache[key] = data.id;
        return data.id;
    }

    // Si no existe, crearla
    console.log(`[Sucursales] Creando sucursal "${key}"...`);
    const { data: created, error: createError } = await supabase
        .from('sucursales')
        .insert({ nombre: key, escuela_id: escuelaId })
        .select('id')
        .single();

    if (createError) {
        console.error(`Error al crear sucursal "${key}":`, createError.message);
        throw createError;
    }
    sucursalesCache[key] = created.id;
    return created.id;
}

async function resolverCancha(nombre, escuelaId) {
    const key = nombre.trim();
    if (canchasCache[key]) return canchasCache[key];

    // Buscar en la base de datos
    const { data, error } = await supabase
        .from('canchas')
        .select('id')
        .eq('nombre', key)
        .eq('escuela_id', escuelaId)
        .maybeSingle();

    if (error) {
        console.error(`Error al buscar cancha/grupo "${key}":`, error.message);
        throw error;
    }
    if (data) {
        canchasCache[key] = data.id;
        return data.id;
    }

    // Si no existe, crearla
    console.log(`[Canchas/Grupos] Creando grupo "${key}"...`);
    const { data: created, error: createError } = await supabase
        .from('canchas')
        .insert({ nombre: key, escuela_id: escuelaId })
        .select('id')
        .single();

    if (createError) {
        console.error(`Error al crear cancha/grupo "${key}":`, createError.message);
        throw createError;
    }
    canchasCache[key] = created.id;
    return created.id;
}

async function resolverHorario(hora, escuelaId) {
    const key = hora.trim();
    if (horariosCache[key]) return horariosCache[key];

    // Buscar en la base de datos
    const { data, error } = await supabase
        .from('horarios')
        .select('id')
        .eq('hora', key)
        .eq('escuela_id', escuelaId)
        .maybeSingle();

    if (error) {
        console.error(`Error al buscar horario "${key}":`, error.message);
        throw error;
    }
    if (data) {
        horariosCache[key] = data.id;
        return data.id;
    }

    // Si no existe, crearla
    console.log(`[Horarios] Creando horario "${key}"...`);
    const { data: created, error: createError } = await supabase
        .from('horarios')
        .insert({ hora: key, escuela_id: escuelaId, activo: true })
        .select('id')
        .single();

    if (createError) {
        console.error(`Error al crear horario "${key}":`, createError.message);
        throw createError;
    }
    horariosCache[key] = created.id;
    return created.id;
}

// ==========================================
// PROCESO PRINCIPAL
// ==========================================
async function registrarAlumnos() {
    console.log('🚀 Iniciando proceso de registro de alumnos en Fundación Inter Stars...');

    // 1. Obtener y mapear entrenadores existentes de la escuela
    console.log('🔍 Obteniendo entrenadores de la base de datos...');
    const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('id, nombres, apellidos')
        .eq('escuela_id', ESCUELA_ID);

    if (usersError) {
        console.error('❌ Error al obtener los entrenadores:', usersError.message);
        return;
    }

    const coachMap = {};
    users.forEach(u => {
        const fullName = `${u.nombres} ${u.apellidos}`;
        coachMap[cleanName(fullName)] = u.id;
        // Agregar variantes comunes
        coachMap[cleanName(u.nombres)] = u.id;
    });

    console.log(`✅ Se encontraron ${users.length} entrenadores en la base de datos.`);

    // 2. Parsear los datos del TSV
    const lines = rawTSV.split('\n');
    const alumnosAProcesar = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('\t');
        if (parts.length < 10) {
            console.warn(`⚠️ Fila ${i + 1} incompleta (tiene menos de 10 columnas):`, line);
            continue;
        }

        const nombres = parts[0].trim();
        const apellidos = parts[1].trim();
        const telPadreRaw = parts[2].trim();
        const telMadreRaw = parts[3].trim();
        const entrenadorRaw = parts[4].trim();
        const sucursalRaw = parts[5].trim();
        const horarioRaw = parts[6].trim();
        const grupoRaw = parts[7].trim();
        const tipoRaw = parts[8].trim();
        const mensualidadRaw = parts[9].trim();

        // Limpieza y formateo
        const telPadre = cleanPhone(telPadreRaw);
        const telMadre = cleanPhone(telMadreRaw);
        const mensualidad = parseMensualidad(mensualidadRaw);
        const fechaNacimiento = calcularFechaNacimiento(grupoRaw);

        // Nombres de los padres genéricos si tenemos celular
        const nombrePadre = telPadre ? `Papá de ${nombres}` : null;
        const nombreMadre = telMadre ? `Mamá de ${nombres}` : null;

        // Resolución del entrenador
        const coachKey = cleanName(entrenadorRaw);
        const entrenadorId = coachMap[coachKey] || null;

        if (!entrenadorId && entrenadorRaw) {
            console.warn(`⚠️ No se pudo asociar el entrenador "${entrenadorRaw}" para ${nombres} ${apellidos}. Se buscará asociar al creador por defecto.`);
        }

        alumnosAProcesar.push({
            originalLine: i + 1,
            nombres,
            apellidos,
            fecha_nacimiento: fechaNacimiento,
            telefono_padre: telPadre,
            telefono_madre: telMadre,
            nombre_padre: nombrePadre,
            nombre_madre: nombreMadre,
            tipo: tipoRaw,
            mensualidad: mensualidad,
            sucursalNombre: sucursalRaw,
            canchaNombre: grupoRaw,
            horarioHora: horarioRaw,
            entrenadorId: entrenadorId || SUPER_ADMIN_ID,
            entrenadorNombre: entrenadorRaw
        });
    }

    console.log(`📊 Listo para importar ${alumnosAProcesar.length} alumnos.`);

    let successCount = 0;
    let errorCount = 0;

    // 3. Procesar e insertar registros de forma secuencial
    for (const item of alumnosAProcesar) {
        try {
            // Resolver IDs de dependencias
            const sucursalId = await resolverSucursal(item.sucursalNombre, ESCUELA_ID);
            const canchaId = await resolverCancha(item.canchaNombre, ESCUELA_ID);
            const horarioId = await resolverHorario(item.horarioHora, ESCUELA_ID);

            // Verificar si el alumno ya está registrado para evitar duplicados
            const { data: existingAlumno, error: searchError } = await supabase
                .from('alumnos')
                .select('id')
                .eq('nombres', item.nombres)
                .eq('apellidos', item.apellidos)
                .eq('escuela_id', ESCUELA_ID)
                .maybeSingle();

            if (searchError) {
                console.error(`❌ Fila ${item.originalLine} (${item.nombres} ${item.apellidos}): Error al buscar duplicados ->`, searchError.message);
                errorCount++;
                continue;
            }

            if (existingAlumno) {
                console.log(`⏩ Fila ${item.originalLine}: ${item.nombres} ${item.apellidos} ya está registrado.`);
                successCount++;
                continue;
            }

            // Si ambos nombres de representantes son nulos, rellenamos el padre con un nombre genérico
            let finalNombrePadre = item.nombre_padre;
            if (!item.nombre_padre && !item.nombre_madre) {
                finalNombrePadre = `Representante de ${item.nombres}`;
            }

            // Crear el objeto del alumno para insertar
            const alumnoRecord = {
                nombres: item.nombres,
                apellidos: item.apellidos,
                fecha_nacimiento: item.fecha_nacimiento,
                telefono_padre: item.telefono_padre,
                telefono_madre: item.telefono_madre,
                nombre_padre: finalNombrePadre,
                nombre_madre: item.nombre_madre,
                escuela_id: ESCUELA_ID,
                created_by: SUPER_ADMIN_ID,
                sucursal_id: sucursalId,
                cancha_id: canchaId,
                horario_id: horarioId,
                tipo: item.tipo,
                mensualidad: item.mensualidad,
                estado: 'Pendiente',
                archivado: false
            };

            // Inserción del alumno
            const { data: inserted, error: insertError } = await supabase
                .from('alumnos')
                .insert([alumnoRecord])
                .select('id, nombres, apellidos')
                .single();

            if (insertError) {
                console.error(`❌ Fila ${item.originalLine} (${item.nombres} ${item.apellidos}): Error de inserción ->`, insertError.message);
                errorCount++;
                continue;
            }

            // Inserción de la relación entrenador
            const { error: relError } = await supabase
                .from('alumnos_entrenadores')
                .insert([{
                    alumno_id: inserted.id,
                    entrenador_id: item.entrenadorId
                }]);

            if (relError) {
                console.error(`⚠️ Fila ${item.originalLine} (${item.nombres} ${item.apellidos}): Alumno registrado, pero falló la relación de entrenador ->`, relError.message);
            }

            console.log(`✅ Fila ${item.originalLine}: ${inserted.nombres} ${inserted.apellidos} registrado exitosamente. (Grupo: ${item.canchaNombre}, Coach: ${item.entrenadorNombre})`);
            successCount++;

        } catch (err) {
            console.error(`❌ Fila ${item.originalLine} (${item.nombres} ${item.apellidos}): Error inesperado ->`, err.message || err);
            errorCount++;
        }
    }

    console.log('\n=============================================');
    console.log('🏁 RESULTADOS DE LA IMPORTACIÓN');
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Fallidos: ${errorCount}`);
    console.log('=============================================');
}

registrarAlumnos();
