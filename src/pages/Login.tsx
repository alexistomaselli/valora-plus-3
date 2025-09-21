import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Mail, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [tallerName, setTallerName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !tallerName || !acceptTerms) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos obligatorios y acepta los términos.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast({
        title: "Código enviado",
        description: `Hemos enviado un código de verificación a ${email}`,
      });
    }, 1500);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Por favor, introduce el código de 6 dígitos que recibiste por email.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      // Redirect to app
      window.location.href = '/app/nuevo';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calculator className="h-8 w-8 text-primary-foreground" />
            <span className="text-2xl font-bold text-primary-foreground">Valora Plus</span>
          </div>
          <p className="text-primary-foreground/80">Accede para empezar tu análisis gratuito</p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              {step === 'email' ? (
                <>
                  <Mail className="h-5 w-5 text-primary" />
                  <span>Crear cuenta / Iniciar sesión</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Verificar código</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Introduce tus datos para acceder con código OTP' 
                : `Código enviado a ${email}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email del taller *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@mitaller.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-glow"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taller">Nombre del taller *</Label>
                  <Input
                    id="taller"
                    placeholder="Taller Mecánico SL"
                    value={tallerName}
                    onChange={(e) => setTallerName(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-glow"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="612 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="transition-all duration-300 focus:shadow-glow"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    Acepto los{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      términos y condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      política de privacidad
                    </Link>
                    . Doy mi consentimiento para el tratamiento de mis datos según el RGPD.
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando código...' : 'Enviar código OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Código de verificación</Label>
                  <Input
                    id="otp"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest transition-all duration-300 focus:shadow-glow"
                    required
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Introduce el código de 6 dígitos que hemos enviado a tu email
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verificando...' : 'Verificar y acceder'}
                </Button>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('email')}
                >
                  Cambiar email
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-6 text-primary-foreground/60 text-sm">
          <p>🔒 Tus datos están protegidos con cifrado de extremo a extremo</p>
          <p className="mt-1">3 análisis gratuitos al mes • Sin tarjeta de crédito</p>
        </div>
      </div>
    </div>
  );
};

export default Login;