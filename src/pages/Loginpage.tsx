import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 3 demo users
  const demoUsers = [
    { email: "Veer@techpath.com", password: "123456" },
    { email: "ujjwalshukla291@gmail.com", password: "654321" },
    { email: "Tanish@techpath.com", password: "111111" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedUser = demoUsers.find(
      (user) => user.email === email && user.password === password
    );

    if (matchedUser) {
      // extract name before '@'
      const name = matchedUser.email.split("@")[0];
      localStorage.setItem("username", name);
      setError("");
      navigate("/"); // go back to Index
    } else {
      setError("Wrong Email Or Passoword");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md p-8 border border-border bg-card shadow-lg hover-lift">
        <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full mt-2">
            Sign In
          </Button>
        </form>

        <div className="text-sm text-center text-muted-foreground mt-6 space-y-1">
          
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
