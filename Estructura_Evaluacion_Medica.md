# **Estructura Técnica: Ficha Médica de Evaluación Deportiva (SaaSport)**

Este documento define los requerimientos clínicos mínimos y el alcance técnico solicitados por **SaaSport** para la ejecución de evaluaciones de aptitud física dirigidas a niños y adolescentes deportistas.

## **1\. DATOS GENERALES**

Información básica de registro que la plataforma SaaSport precarga automáticamente en la interfaz del evaluador:

* **Nombre y apellidos del jugador**  
* **Edad / Sexo / Fecha de nacimiento**  
* **Deporte que practica**  
* **Fecha de la revisión**

## **2\. ANTECEDENTES MÉDICOS (Anamnesis Dirigida)**

Interrogatorio preventivo enfocado en la detección de factores de riesgo mayor durante la práctica de deportes de alta intensidad.

| Campo de Registro | Tipo de Entrada | Objetivo Clínico / Justificación |
| :---- | :---- | :---- |
| **Antecedentes médicos personales** | Texto libre | Registro de patologías crónicas de base (Asma, diabetes, epilepsia, etc.). |
| **Alergias (especifique)** | Texto libre | Control de alérgenos farmacológicos o ambientales. |
| **Cirugías previas (especifique)** | Texto libre | Verificación de tiempos de recuperación y cicatrización tisular adecuados. |
| **Antecedentes familiares críticos** | Checkbox (Sí/No) \+ Detalle | **Cribado de Muerte Súbita:** Casos directos en la familia de muerte súbita \< 50 años, cardiopatías congénitas, arritmias o uso de marcapasos. |
| **Síntomas de esfuerzo** | Checkbox múltiple | **Riesgo Cardiovascular:** Presencia de palpitaciones anómalas, dolor/presión en el pecho, síncope (desmayos) o disnea desproporcionada durante el ejercicio. |
| **Historial de trauma craneal** | Checkbox (Sí/No) \+ Detalle | **Gestión de Conmociones:** Registro de pérdidas de conocimiento, mareos o desorientación causados por choques o golpes previos en la cabeza. |

## **3\. SIGNOS VITALES Y ANTROPOMETRÍA**

Métricas cuantitativas obtenidas mediante instrumental clínico estándar de consultorio.

* **Presión arterial (mmHg):** Medición obligatoria utilizando esfigmomanómetro estándar (con brazalete de tamaño adecuado según la edad).  
* **Frecuencia cardíaca (lpm)**  
* **Frecuencia respiratoria (rpm)**  
* **Peso (kg) & Talla (m)**  
* **Índice de Masa Corporal (IMC):** *Calculado automáticamente por el backend de SaaSport* (![][image1]).  
* **Pulsos periféricos simétricos:** Selección única (Simétricos y presentes / Asimétricos o ausentes). Se evalúa mediante la palpación manual y simultánea de los pulsos radiales (muñeca) y pedios (pie) para descartar anomalías estructurales de flujo de manera ágil.

## **4\. EVALUACIÓN FÍSICA POR SISTEMAS (Exploración Clínica Directa)**

Maniobras y exploraciones físicas esenciales que debe ejecutar el profesional evaluador.

### **A. Sistema Cardiovascular**

* **Metodología:** Auscultación dinámica obligatoria en dos posiciones:  
  1. *Decúbito supino (Acostado)*  
  2. *Bipedestación (De pie)*  
* **Criterio Clínico:** Detección de soplos cardíacos. Los soplos de carácter patológico (como en la Miocardiopatía Hipertrófica) incrementan notablemente su intensidad acústica al ponerse de pie, facilitando al médico la sospecha clínica de una anomalía mayor para su derivación oportuna.

### **B. Sistema Respiratorio**

* **Metodología:** Auscultación pulmonar estándar de campos anteriores y posteriores.  
* **Criterio Clínico:** Detección de sibilancias, roncus o disminución del murmullo vesicular para identificar condiciones como el asma inducida por el ejercicio.

### **C. Sistema Músculo-esquelético y Articular**

* **Maniobras y Pruebas requeridas:**  
  1. **Estabilidad ligamentosa:** Evaluación manual de rodilla y tobillo mediante pruebas de *Cajón Anterior, Lachman y estrés lateral* para descartar inestabilidades crónicas por lesiones previas.  
  2. **Test de Adams (Columna):** Inspección posterior con flexión anterior de tronco (el paciente se inclina intentando tocar sus pies) para evaluar asimetrías costales o sospecha de escoliosis.  
  3. **Palpación de la tuberosidad tibial anterior:** Presión directa para descartar dolor por tracción del tendón rotuliano, característico del síndrome de *Osgood-Schlatter* (muy común en etapas de crecimiento).

## **5\. EVALUACIÓN FUNCIONAL**

Mapeo visual rápido de la biomecánica en el consultorio.

* **Marcha:** Normal / Inestable o claudicante  
* **Equilibrio:** Adecuado / Inestable  
* **Fuerza general:** Adecuada / Disminuida  
* **Dolor durante el movimiento:** Sí / No (Si la respuesta es Sí, el sistema despliega un campo de texto para especificar zona)

## **6\. APTITUD DEPORTIVA Y RESPONSABLE**

Cierre formal del acto médico de evaluación y asignación de responsabilidades.

* **Dictamen de Aptitud:** Selección única obligatoria:  
  * \[ \] **APTO** para la práctica deportiva competitiva.  
  * \[ \] **APTO CON RESTRICCIONES** (El sistema solicita especificar condiciones en el campo complementario).  
  * \[ \] **NO APTO** (El jugador requiere derivación y resolución por especialista antes de volver a aplicar).  
* **Nombre del profesional evaluador**  
* **Registro / Matrícula Profesional**  
* **Firma del médico y Fecha**

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAAAaCAYAAACATbNJAAAFXklEQVR4Xu1ZTWhUVxSeYAqKbVU0hvzNnfxIUMQuQgsRFy5ErFIJVVBowaUI4kbwbyG6ENFVKdJC0EUXrS2VanFhW0QCSglE0I0olkJapEVFpYVZ+BPT73vv3PG88+44b8xATH0fHObd75x73rn/574pFHLkyNE4FIvFVaVSabblc8wAYPB+xuDt57Nz7hJk2Nr839GMRp/mr1XMFCD+SUiZz/39/e+wbG0yo729fRFnQUCOY6ZshQzBrMnWm05gFvcgvr8U1QxucxZBvbaOjo6Fqm5N0B71TqH+n/q96JtjKF8nD9ml69QC6k1AbvK5paXl7SkNogecrKejzs7OJZpHcAfJQzZpfjqBWEYgJ3wZnXlIYvy+u7sbP64N8gM56H6RchvaclTsDmh/WeBXC+RvzaN8mTwnlubrAWJc55KT8pXA7ekMg7EKgoFX000HEMtoT0/PPFV+rPXClSFP0bmrDJ/isgB11sggHtE8ys+n0jcDAwNvof4Ty9cNNoqN42BZHSHBv3KgjQS3+K6uruW+jNgXcCUqE6JJYv6az1oBbox1NJcFqHeR/aNXXGtr61x5T7DfsgCx3+YvdsAOq6sLTlYhAtxrddieWkX3pdUR0H0IOQ7ZbXWCWai7B/ph+FprlYImNGYbbL6A7adWqQGb+6a8krNZczIpGfOA5oFmTICNhmNHzuZKw+9hq/MI9Q99hXgP+mXfYID6rA598QF0151s9ZBvrE1dgINxCWaN1ckATPKssTrwFyBPXDxLHyHoHQGbXyG3IKcgEwE/XDXXIHddnGpPwM8xY1MB9HcsZ4H626U9NVec385ERlB3H34fFNIrONU/4I5Anlue8H6hOydtSvjlCqRPJU+Ni/rgHeGFy/DbhhcMsSPxfI+BYCbN0fYSIOskkh0nKbMHfHzm1BmC58fgvvNl74ez0nNiR9+DmhN+EPXXWd7CyaS0vAXPVdr19vYu9hzKZ21dlJcKl7jSgHsAOWN561famfLbMCB97pROy/wC2P7mTDKBzv3RpQf1D0jZp/SyvUUzkc/UOUmzNRgL/H0V4FO2IUh7xixvwTZARg03ArlhuM9dYKXwPdy6DTdo/coVIuW3YXDxlsBGX7S6ahD7q5BhbrfVzjroN4mtl0dKN04usBX5pCSRBRbiu+BPhktBTcqPrU6DiYS83w4CJ9B2w/kVp7lqq9O3q+LXn53Wb8Pg4vMs1GlB+Isp5BOrC6AJjflW7CMpyXdCF2fDvJcmsjL5+EC7xLbp4k6r+U5OCnnXUqvT8HZM3DRPTnaMBGcHgLGQ15zw0ZVD+3XxSk75bRikweO2M6uBg1ArIDTgPdjch5xXdLTCeGlmQd5rO4E2J9gRhqf9CPWWt3AyKS1vgfg/snbuxepiHKchJ2G3gJxMrp2QK2I75mR7JN/X1/euPE8G/HIlV/xq3ZThAyxWSZGrAXXKGMytmsPArXCyJfM8k8ZUtjSm2U5dD9gY2uhPYCXJ2PRF3sNlOOMIeW/Ne5tPPgpqYrj4U1h09hXjT2zdnKxiR/1dv0Pgucx+452VvPIxqv26F0dKxa+3nRLUJTUhdQwmZ9Q/kIe+LgdR69HYLaLjiuTvBaWPoM4vZsFRdmxtCJ4p+oJv4WMIycvapGKkMGny5/Ez80WICdi/Tm3ReN4gtr9rvpBs+yTifh+/u0N+px1MmxHsEIIq2su2B1NsDO5afw6GAN18dPTml9hE/1jYa06jwG/FeHepICtHzvzEecrYIKs1J/zqanErvxFCft8YuPgcqnnBz/EaAwP4sJThgp/jNQUTr1L643aOGYZZhQzXihw5cuTIkSPHm4v/ACUu7ae74tg4AAAAAElFTkSuQmCC>