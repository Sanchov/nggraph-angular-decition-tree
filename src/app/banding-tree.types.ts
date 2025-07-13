type JobEvaluationBandingTreeNodeDecision = {
  nodeId?: string;
  bandId?: string;
};

type JobEvaluationBandingTreeNode = {
  id: string; 
  question: string;
  isRoot: boolean; 

  yes: JobEvaluationBandingTreeNodeDecision;
  no: JobEvaluationBandingTreeNodeDecision;
};

type JobEvaluationBandingTree = JobEvaluationBandingTreeNode[];

const tree: JobEvaluationBandingTree = [
  {
    id: '1',
    isRoot: true,
    question: 'Managing People a Focus?',
    yes: {
      nodeId: '2',
    },
    no: {
      bandId: "2"
    },
  },
  {
    id: '2',
    isRoot: false,
    question: 'Manage Professionals/Managers?',
    yes: {},
    no: {},
  },
];

const BANDS_LIST = [
  {
    id: '1',
    name: 'band 1',
  },
  {
    id: '2',
    name: 'band 2',
  },
  {
    id: '3ic',
    name: '3ic',
  },
];
/*
{
  "_id": "banding_decision_tree",
  "version": "1.0",
  "root": {
    "question": "Management Roles?",
    "yes": {
      "question": "Manage Professionals/Managers?",
      "yes": {
        "question": "Set/significantly influence functional strategy?",
        "yes": {
          "question": "Set/significantly influence business strategy?",
          "yes": {
            "question": "CEO/Business Unit Manager?",
            "yes": {
              "question": "Managing People a Focus?",
              "bandId": "CEO"
            },
            "no": {
              "bandId": "Business Unit Manager"
            }
          },
          "no": {
            "bandId": "Senior Manager"
          }
        },
        "no": {
          "bandId": "Manager"
        }
      },
      "no": {
        "question": "Specific Functional Knowledge?",
        "yes": {
          "question": "Independent in Applying Professional Expertise?",
          "yes": {
            "question": "Subject Matter Expert?",
            "yes": {
              "bandId": "4IC"
            },
            "no": {
              "bandId": "3IC"
            }
          },
          "no": {
            "bandId": "2IC"
          }
        },
        "no": {
          "bandId": "1IC"
        }
      }
    }
  },
  "metadata": {
    "source": "www.rewatson.com",
    "copyright": "© 2010 Towers Watson",
    "notes": "Proprietary and Confidential"
  }
}
*/
