import { Github, Linkedin, Mail } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-6">
            About the Creator
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            This project was developed by Anshuman, an engineer passionate about leveraging artificial intelligence to improve clinical decision-making and patient safety.
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/anshumanvatsa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Github className="h-6 w-6" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/anshumanvatsa/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Linkedin className="h-6 w-6" />
              <span>LinkedIn</span>
            </a>
            <a
              href="mailto:atulvatsamishra@gmail.com"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Mail className="h-6 w-6" />
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
