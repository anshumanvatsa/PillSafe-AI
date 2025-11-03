import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertTriangle, Stethoscope, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import safetyCheckImage from "@/assets/safety-check.jpg";
import { API_BASE_URL } from "@/config";

interface FormData {
  Age: number;
  Sex: string;
  Weight_kg: number;
  Height_cm: number;
  BMI: number;
  Ethnicity: string;
  Comorbidities: string;
  Known_Allergies: string;
  Previous_Adverse_Reactions: string;
  Current_Medications: string;
  Herbal_Supplements: string;
  Alcohol_Use: string;
  Smoking_Status: string;
  Creatinine_mg_dL: number;
  eGFR_mL_min: number;
  ALT_U_L: number;
  AST_U_L: number;
  Bilirubin_mg_dL: number;
  Hemoglobin_g_dL: number;
  QTc_ms: number;
  CYP2D6_status: string;
  CYP2C19_status: string;
  HLA_B_5701: string;
  Other_Genetic_Risks: string;
  Drug_Name: string;
  Drug_Dose_mg: number;
  Drug_Route: string;
  Drug_Frequency: string;
}

const DrugSafetyPredictor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [csvSummary, setCsvSummary] = useState<{ safe: number; harmful: number } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    Age: 0,
    Sex: "",
    Weight_kg: 0,
    Height_cm: 0,
    BMI: 0,
    Ethnicity: "",
    Comorbidities: "",
    Known_Allergies: "",
    Previous_Adverse_Reactions: "",
    Current_Medications: "",
    Herbal_Supplements: "",
    Alcohol_Use: "",
    Smoking_Status: "",
    Creatinine_mg_dL: 0,
    eGFR_mL_min: 0,
    ALT_U_L: 0,
    AST_U_L: 0,
    Bilirubin_mg_dL: 0,
    Hemoglobin_g_dL: 0,
    QTc_ms: 0,
    CYP2D6_status: "",
    CYP2C19_status: "",
    HLA_B_5701: "",
    Other_Genetic_Risks: "",
    Drug_Name: "",
    Drug_Dose_mg: 0,
    Drug_Route: "",
    Drug_Frequency: "",
  });

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ---------------- CSV helpers (robust Final_Summary counting) ----------------
  function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          cur += '"'; // escaped quote
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map(s => s.trim().replace(/^\uFEFF/, "")); // trim + remove BOM if present
  }

  function summarizeFromCsvText(text: string): { safe: number; harmful: number } {
    const lines = text.split(/\r?\n/).filter(l => l.length > 0);
    if (lines.length === 0) return { safe: 0, harmful: 0 };

    const header = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ""));
    const finalIdx = header.findIndex(h => h.toLowerCase() === "final_summary" || h.toLowerCase() === "final summary");

    // If we can't find Final_Summary, fall back to global counts (less precise)
    if (finalIdx === -1) {
      const safe = (text.match(/(^|,)\s*Safe\s*(?=,|$)/gmi) || []).length;
      const unsafe = (text.match(/(^|,)\s*Unsafe\s*(?=,|$)/gmi) || []).length;
      return { safe, harmful: unsafe };
    }

    let safe = 0;
    let harmful = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      if (row.length <= finalIdx) continue;
      const val = row[finalIdx].replace(/^"|"$/g, "").trim().toLowerCase();
      if (val === "safe") safe++;
      else if (val === "unsafe" || val === "harmful") harmful++; // map Unsafe → harmful
    }
    return { safe, harmful };
  }
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPrediction(null);
    setShowResult(false);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to get prediction");
      }

      const result = await response.json();
      setPrediction(result.prediction || result.result);
      setShowResult(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the prediction service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setShowResult(false);
    setCsvSummary(null);

    try {
      const form = new FormData();
      form.append("file", csvFile);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process CSV file");
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/csv")) {
        // Read CSV as text, summarize Final_Summary, then download
        const blob = await response.blob();
        const text = await blob.text();

        const { safe, harmful } = summarizeFromCsvText(text);
        setCsvSummary({ safe, harmful });

        // Trigger download
        const url = window.URL.createObjectURL(new Blob([text], { type: "text/csv" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "drug_safety_predictions.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: `CSV processed! Safe: ${safe}, Harmful: ${harmful}`,
        });
      } else {
        // JSON fallback (if backend ever returns JSON)
        const result = await response.json();
        const safe = Number(result.safe ?? result.safe_count ?? 0);
        const harmful = Number(result.harmful ?? result.unsafe_count ?? 0);
        setCsvSummary({ safe, harmful });
        toast({
          title: "Success",
          description: result.message || "CSV file processed successfully!",
        });
      }
    } catch (error) {
      console.error("CSV processing error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="safety-check" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground">
              Drug Safety Analysis
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enter comprehensive patient and medication information for AI-powered safety prediction
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <Card className="h-full shadow-xl border-0 bg-card">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <img 
                    src={safetyCheckImage} 
                    alt="Drug Safety Analysis"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Comprehensive Analysis
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Patient medical history</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Drug interaction analysis</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Genetic risk factors</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Laboratory value assessment</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="text-sm font-medium text-primary mb-1">
                      Analysis Time
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Typically completed in under 3 seconds
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
          <Card className="shadow-2xl border-0 bg-card">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">Drug Safety Analysis</CardTitle>
              <CardDescription>
                Choose between manual entry or CSV file upload for batch analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="manual" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Manual Entry</span>
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>CSV Upload</span>
                  </TabsTrigger>
                </TabsList>

                {/* ----------------- FULL MANUAL ENTRY FORM (kept intact) ----------------- */}
                <TabsContent value="manual">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.Age || ""}
                        onChange={(e) => handleInputChange("Age", parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <Select value={formData.Sex} onValueChange={(value) => handleInputChange("Sex", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.Weight_kg || ""}
                        onChange={(e) => handleInputChange("Weight_kg", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.Height_cm || ""}
                        onChange={(e) => handleInputChange("Height_cm", parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bmi">BMI</Label>
                      <Input
                        id="bmi"
                        type="number"
                        step="0.1"
                        value={formData.BMI || ""}
                        onChange={(e) => handleInputChange("BMI", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ethnicity">Ethnicity</Label>
                      <Input
                        id="ethnicity"
                        value={formData.Ethnicity}
                        onChange={(e) => handleInputChange("Ethnicity", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Medical History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="comorbidities">Comorbidities</Label>
                      <Input
                        id="comorbidities"
                        value={formData.Comorbidities}
                        onChange={(e) => handleInputChange("Comorbidities", e.target.value)}
                        placeholder="e.g., Diabetes, Hypertension"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allergies">Known Allergies</Label>
                      <Input
                        id="allergies"
                        value={formData.Known_Allergies}
                        onChange={(e) => handleInputChange("Known_Allergies", e.target.value)}
                        placeholder="e.g., Penicillin, Peanuts"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adverse">Previous Adverse Reactions</Label>
                      <Input
                        id="adverse"
                        value={formData.Previous_Adverse_Reactions}
                        onChange={(e) => handleInputChange("Previous_Adverse_Reactions", e.target.value)}
                        placeholder="Previous drug reactions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current-meds">Current Medications</Label>
                      <Input
                        id="current-meds"
                        value={formData.Current_Medications}
                        onChange={(e) => handleInputChange("Current_Medications", e.target.value)}
                        placeholder="Current medications"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplements">Herbal Supplements</Label>
                      <Input
                        id="supplements"
                        value={formData.Herbal_Supplements}
                        onChange={(e) => handleInputChange("Herbal_Supplements", e.target.value)}
                        placeholder="Herbal supplements"
                      />
                    </div>
                  </div>
                </div>

                {/* Lifestyle */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Lifestyle
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alcohol">Alcohol Use</Label>
                      <Select value={formData.Alcohol_Use} onValueChange={(value) => handleInputChange("Alcohol_Use", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alcohol use" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sometimes">Sometimes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smoking">Smoking Status</Label>
                      <Select value={formData.Smoking_Status} onValueChange={(value) => handleInputChange("Smoking_Status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select smoking status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Former">Former</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Laboratory Values */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Laboratory Values
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
                      <Input
                        id="creatinine"
                        type="number"
                        step="0.01"
                        value={formData.Creatinine_mg_dL || ""}
                        onChange={(e) => handleInputChange("Creatinine_mg_dL", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="egfr">eGFR (mL/min)</Label>
                      <Input
                        id="egfr"
                        type="number"
                        value={formData.eGFR_mL_min || ""}
                        onChange={(e) => handleInputChange("eGFR_mL_min", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alt">ALT (U/L)</Label>
                      <Input
                        id="alt"
                        type="number"
                        value={formData.ALT_U_L || ""}
                        onChange={(e) => handleInputChange("ALT_U_L", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ast">AST (U/L)</Label>
                      <Input
                        id="ast"
                        type="number"
                        value={formData.AST_U_L || ""}
                        onChange={(e) => handleInputChange("AST_U_L", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bilirubin">Bilirubin (mg/dL)</Label>
                      <Input
                        id="bilirubin"
                        type="number"
                        step="0.01"
                        value={formData.Bilirubin_mg_dL || ""}
                        onChange={(e) => handleInputChange("Bilirubin_mg_dL", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hemoglobin">Hemoglobin (g/dL)</Label>
                      <Input
                        id="hemoglobin"
                        type="number"
                        step="0.1"
                        value={formData.Hemoglobin_g_dL || ""}
                        onChange={(e) => handleInputChange("Hemoglobin_g_dL", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qtc">QTc (ms)</Label>
                      <Input
                        id="qtc"
                        type="number"
                        value={formData.QTc_ms || ""}
                        onChange={(e) => handleInputChange("QTc_ms", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Genetic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Genetic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cyp2d6">CYP2D6 Status</Label>
                      <Input
                        id="cyp2d6"
                        value={formData.CYP2D6_status}
                        onChange={(e) => handleInputChange("CYP2D6_status", e.target.value)}
                        placeholder="e.g., Normal, Poor metabolizer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cyp2c19">CYP2C19 Status</Label>
                      <Input
                        id="cyp2c19"
                        value={formData.CYP2C19_status}
                        onChange={(e) => handleInputChange("CYP2C19_status", e.target.value)}
                        placeholder="e.g., Normal, Poor metabolizer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hla">HLA-B*5701</Label>
                      <Input
                        id="hla"
                        value={formData.HLA_B_5701}
                        onChange={(e) => handleInputChange("HLA_B_5701", e.target.value)}
                        placeholder="Positive/Negative"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genetic-risks">Other Genetic Risks</Label>
                      <Input
                        id="genetic-risks"
                        value={formData.Other_Genetic_Risks}
                        onChange={(e) => handleInputChange("Other_Genetic_Risks", e.target.value)}
                        placeholder="Other genetic risk factors"
                      />
                    </div>
                  </div>
                </div>

                {/* Drug Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    Drug Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="drug-name">Drug Name</Label>
                      <Input
                        id="drug-name"
                        value={formData.Drug_Name}
                        onChange={(e) => handleInputChange("Drug_Name", e.target.value)}
                        placeholder="Enter drug name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="drug-dose">Drug Dose (mg)</Label>
                      <Input
                        id="drug-dose"
                        type="number"
                        step="0.1"
                        value={formData.Drug_Dose_mg || ""}
                        onChange={(e) => handleInputChange("Drug_Dose_mg", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="drug-route">Drug Route</Label>
                      <Input
                        id="drug-route"
                        value={formData.Drug_Route}
                        onChange={(e) => handleInputChange("Drug_Route", e.target.value)}
                        placeholder="e.g., Oral, IV, IM"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="drug-frequency">Drug Frequency</Label>
                      <Input
                        id="drug-frequency"
                        value={formData.Drug_Frequency}
                        onChange={(e) => handleInputChange("Drug_Frequency", e.target.value)}
                        placeholder="e.g., Once daily, Twice daily"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Predict Drug Safety"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
                {/* ----------------- END MANUAL ENTRY FORM ----------------- */}

            <TabsContent value="csv">
              <form onSubmit={handleCsvUpload} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                    CSV File Upload
                  </h3>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <Label htmlFor="csv-file" className="text-lg font-medium cursor-pointer">
                        Upload CSV File
                      </Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mt-2"
                        required
                      />
                      {csvFile && (
                        <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
                          <p className="text-sm text-success font-medium">
                            Selected: {csvFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h4 className="font-medium text-foreground">CSV Format Requirements:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• File must contain all required columns (Age, Sex, Weight_kg, etc.)</li>
                        <li>• Use comma-separated values format</li>
                        <li>• First row should contain column headers</li>
                        <li>• Multiple patient records can be processed at once</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 text-lg"
                    disabled={isLoading || !csvFile}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing CSV...
                      </>
                    ) : (
                      "Analyze CSV Data"
                    )}
                  </Button>
                </div>
              </form>

              {/* CSV Summary Display */}
              {csvSummary && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6"
                >
                  <Card 
                    className={`shadow-xl border-0 ${
                      csvSummary.harmful > 0 
                        ? "bg-destructive/10 border-destructive/20" 
                        : "bg-success/10 border-success/20"
                    }`}
                  >
                    <CardContent className="pt-6 text-center">
                      {csvSummary.harmful > 0 ? (
                        <>
                          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-2" />
                          <h3 className="text-xl font-bold text-destructive">
                            ⚠️ Some medicines may be Harmful
                          </h3>
                          <p className="text-muted-foreground">
                            Safe: {csvSummary.safe} | Harmful: {csvSummary.harmful}
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mx-auto h-12 w-12 text-success mb-2" />
                          <h3 className="text-xl font-bold text-success">
                            ✅ All medicines look Safe
                          </h3>
                          <p className="text-muted-foreground">
                            Safe: {csvSummary.safe} | Harmful: {csvSummary.harmful}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </motion.div>

        {/* Manual tab result card */}
        {activeTab === "manual" && showResult && prediction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <Card 
              className={`shadow-2xl border-0 ${
                prediction.toLowerCase() === "safe" 
                  ? "bg-success/10 border-success/20" 
                  : "bg-destructive/10 border-destructive/20"
              }`}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {prediction.toLowerCase() === "safe" ? (
                    <>
                      <CheckCircle className="mx-auto h-16 w-16 text-success" />
                      <h3 className="text-2xl font-bold text-success">
                        ✅ This medicine looks Safe
                      </h3>
                      <p className="text-muted-foreground">
                        Based on the provided information, this medication appears to be safe for the patient.
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
                      <h3 className="text-2xl font-bold text-destructive">
                        ⚠️ This medicine may be Harmful
                      </h3>
                      <p className="text-muted-foreground">
                        Based on the provided information, this medication may pose risks. Please consult your healthcare provider.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        </div>
      </div>
    </section>
  );
};

export default DrugSafetyPredictor;
