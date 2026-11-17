export interface ProjectEvaluationSheet {
  studentName: string;
  rollNumber: string;
  department: string;
  semester: string;
  academicYear: string;
  presentationDate: string;
  evaluatorName: string;
  selectedTopic: string;
  syllabusUnit: string;
  objective: string;
  systemArchitecture: string;
  mathematicalFoundations: string;
  securityMechanismsDemonstrated: string;
  attackScenariosCovered: string;
  engineeringImplementationDetails: string;
  evaluationRubric: {
    criteria: string;
    maxMarks: number;
    awardedMarks: number;
    comments: string;
  }[];
  totalMarks: number; // 20
}
