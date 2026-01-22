export interface Scholar {
  id: string;
  name: string;
  title: string;
  institution: string;
  department: string;
  researchInterests: string[];
  publicationCount: number;
  collaboratorCount: number;
  photo?: string;
  bio?: string;
  publications?: Publication[];
  email?: string;
  phone?: string;
  officeLocation?: string;
  education?: Education[];
  awards?: string[];
  projects?: Project[];
  citationCount?: number;
  hIndex?: number;
}
export interface Education {
  degree: string;
  institution: string;
  year: number;
  field: string;
}
export interface Project {
  title: string;
  role: string;
  fundingAgency: string;
  amount?: string;
  duration: string;
  status: 'ongoing' | 'completed';
}
export interface Publication {
  id: string;
  title: string;
  year: number;
  authors: string[];
  doi?: string;
  journal?: string;
  citations?: number;
  type: 'article' | 'conference' | 'book' | 'chapter';
}
export interface Collaboration {
  scholarId: string;
  strength: number;
}
export const mockScholars: Scholar[] = [
  {
    id: '1',
    name: 'Doç. Dr. Ayşe Demir',
    title: 'Associate Professor',
    institution: 'Istanbul Technical University',
    department: 'Molecular Biology and Genetics',
    researchInterests: ['Genomics', 'Bioinformatics', 'Cancer Research', 'Precision Medicine'],
    publicationCount: 87,
    collaboratorCount: 22,
    citationCount: 2453,
    hIndex: 28,
    email: 'ayse.demir@itu.edu.tr',
    phone: '+90 212 285 3000',
    officeLocation: 'Molecular Biology Building, Room 305',
    photo: 'https://i.pravatar.cc/150?img=5',
    bio: 'Dr. Ayşe Demir is an Associate Professor specializing in computational genomics and personalized medicine. Her research focuses on developing machine learning algorithms for analyzing large-scale genomic data, with particular emphasis on cancer genomics and drug response prediction. She has led multiple international collaborations and secured significant research funding from TÜBİTAK and the European Research Council.',
    education: [
      {
        degree: 'Ph.D. in Bioinformatics',
        institution: 'ETH Zurich',
        year: 2014,
        field: 'Computational Biology'
      },
      {
        degree: 'M.Sc. in Molecular Biology',
        institution: 'Boğaziçi University',
        year: 2010,
        field: 'Molecular Biology'
      },
      {
        degree: 'B.Sc. in Biology',
        institution: 'Middle East Technical University',
        year: 2008,
        field: 'Biology'
      }
    ],
    awards: [
      'TÜBİTAK Young Scientist Award (2019)',
      'European Research Council Starting Grant (2020)',
      'Turkish Academy of Sciences Outstanding Young Scientist Award (2021)',
      'International Society for Computational Biology Best Paper Award (2022)'
    ],
    projects: [
      {
        title: 'AI-Driven Cancer Diagnosis Platform',
        role: 'Principal Investigator',
        fundingAgency: 'European Research Council',
        amount: '€1.5M',
        duration: '2020-2025',
        status: 'ongoing'
      },
      {
        title: 'Genomic Biomarkers for Drug Response',
        role: 'Principal Investigator',
        fundingAgency: 'TÜBİTAK',
        amount: '₺850,000',
        duration: '2018-2023',
        status: 'completed'
      }
    ],
    publications: [
      {
        id: 'p1',
        title: 'Machine Learning Approaches in Genomic Data Analysis for Cancer Prediction',
        year: 2024,
        authors: ['Ayşe Demir', 'Mehmet Yılmaz', 'John Smith'],
        doi: '10.1038/nature.2024.001',
        journal: 'Nature Medicine',
        citations: 45,
        type: 'article'
      },
      {
        id: 'p2',
        title: 'CRISPR Applications in Cancer Treatment: A Comprehensive Review',
        year: 2023,
        authors: ['Ayşe Demir', 'Ali Kaya', 'Zeynep Öztürk'],
        doi: '10.1016/cancer.2023.045',
        journal: 'Cancer Cell',
        citations: 128,
        type: 'article'
      },
      {
        id: 'p3',
        title: 'Deep Neural Networks for Protein-Drug Interaction Prediction',
        year: 2023,
        authors: ['Ayşe Demir', 'Sarah Johnson', 'Mehmet Yılmaz'],
        doi: '10.1093/bioinformatics/2023',
        journal: 'Bioinformatics',
        citations: 89,
        type: 'article'
      }
    ]
  },
  {
    id: '2',
    name: 'Prof. Dr. Mehmet Yılmaz',
    title: 'Professor',
    institution: 'Middle East Technical University',
    department: 'Computer Engineering',
    researchInterests: ['Machine Learning', 'Bioinformatics', 'Data Mining', 'Deep Learning'],
    publicationCount: 156,
    collaboratorCount: 35,
    citationCount: 5234,
    hIndex: 42,
    email: 'mehmet.yilmaz@metu.edu.tr',
    phone: '+90 212 359 4000',
    officeLocation: 'Engineering Faculty, Room 501',
    bio: 'Prof. Dr. Mehmet Yılmaz is a leading researcher in AI applications for biological data analysis. With over 20 years of experience, he has pioneered novel deep learning architectures for protein structure prediction and drug discovery. He serves on editorial boards of top-tier journals and has supervised 25+ PhD students.',
    education: [
      {
        degree: 'Ph.D. in Computer Science',
        institution: 'MIT',
        year: 2005,
        field: 'Artificial Intelligence'
      },
      {
        degree: 'M.Sc. in Computer Engineering',
        institution: 'Boğaziçi University',
        year: 2000,
        field: 'Computer Engineering'
      }
    ],
    awards: [
      'ACM Fellow (2022)',
      'IEEE Outstanding Researcher Award (2020)',
      'TÜBİTAK Science Award (2018)',
      'Best Paper Award at ICML (2019, 2021)'
    ],
    projects: [
      {
        title: 'Next-Generation Protein Structure Prediction',
        role: 'Principal Investigator',
        fundingAgency: 'Horizon Europe',
        amount: '€2.3M',
        duration: '2021-2026',
        status: 'ongoing'
      }
    ],
    publications: [
      {
        id: 'p4',
        title: 'Deep Learning for Protein Structure Prediction: AlphaFold and Beyond',
        year: 2024,
        authors: ['Mehmet Yılmaz', 'Ayşe Demir', 'David Lee'],
        doi: '10.1126/science.2024.012',
        journal: 'Science',
        citations: 234,
        type: 'article'
      }
    ]
  },
  {
    id: '3',
    name: 'Doç. Dr. Zeynep Öztürk',
    title: 'Associate Professor',
    institution: 'Middle East Technical University',
    department: 'Bioinformatics',
    researchInterests: ['Genome Assembly', 'Variant Calling', 'Metagenomics', 'NGS Analysis'],
    publicationCount: 65,
    collaboratorCount: 18,
    citationCount: 1876,
    hIndex: 24,
    email: 'zeynep.ozturk@metu.edu.tr',
    bio: 'Expert in next-generation sequencing data analysis with focus on genome assembly algorithms and variant detection pipelines.',
    education: [
      {
        degree: 'Ph.D. in Bioinformatics',
        institution: 'University of Cambridge',
        year: 2015,
        field: 'Computational Genomics'
      }
    ],
    awards: [
      'EMBO Young Investigator Award (2020)',
      'Turkish Academy of Sciences GEBIP Award (2019)'
    ],
    projects: [
      {
        title: 'Turkish Genome Reference Consortium',
        role: 'Co-Principal Investigator',
        fundingAgency: 'TÜBİTAK',
        amount: '₺1.2M',
        duration: '2022-2025',
        status: 'ongoing'
      }
    ]
  },
  {
    id: '4',
    name: 'Prof. Dr. Ali Kaya',
    title: 'Professor',
    institution: 'Istanbul University',
    department: 'Medicine',
    researchInterests: ['Variant Calling', 'Clinical Genomics', 'Precision Medicine', 'Pharmacogenomics'],
    publicationCount: 98,
    collaboratorCount: 28,
    citationCount: 3421,
    hIndex: 35,
    bio: 'Bridging clinical medicine and genomic research with focus on personalized treatment strategies.',
  },
  {
    id: '5',
    name: 'Dr. Fatma Şahin',
    title: 'Assistant Professor',
    institution: 'Hacettepe University',
    department: 'Bioinformatics',
    researchInterests: ['Single-cell RNA-seq', 'Network Biology', 'Systems Biology', 'Cancer Genomics'],
    publicationCount: 43,
    collaboratorCount: 15,
    citationCount: 892,
    hIndex: 18,
    bio: 'Investigating cellular heterogeneity through single-cell technologies and network analysis.',
  },
  {
    id: '6',
    name: 'Prof. Dr. Can Özkan',
    title: 'Professor',
    institution: 'Ankara University',
    department: 'Molecular Biology',
    researchInterests: ['CRISPR', 'Gene Editing', 'Synthetic Biology', 'Genome Engineering'],
    publicationCount: 115,
    collaboratorCount: 31,
    citationCount: 4567,
    hIndex: 38,
    bio: 'Pioneering gene editing technologies for therapeutic applications.',
  },
  {
    id: '7',
    name: 'Doç. Dr. Elif Yıldırım',
    title: 'Associate Professor',
    institution: 'Koç University',
    department: 'Computational Biology',
    researchInterests: ['Metagenomics', 'Microbiome', 'Bioinformatics', 'Host-Microbe Interactions'],
    publicationCount: 71,
    collaboratorCount: 20,
    citationCount: 2134,
    hIndex: 26,
    bio: 'Exploring microbial communities and their impact on health and disease.',
  },
  {
    id: '8',
    name: 'Prof. Dr. Ahmet Demir',
    title: 'Professor',
    institution: 'Sabancı University',
    department: 'Biological Sciences',
    researchInterests: ['Spatial Transcriptomics', 'Single-cell Omics', 'Cancer Biology', 'Tumor Microenvironment'],
    publicationCount: 89,
    collaboratorCount: 25,
    citationCount: 3012,
    hIndex: 32,
    bio: 'Developing new approaches for spatial gene expression analysis in cancer research.',
  },
  {
    id: '9',
    name: 'Dr. Deniz Arslan',
    title: 'Assistant Professor',
    institution: 'Istanbul Technical University',
    department: 'Computer Engineering',
    researchInterests: ['Deep Learning', 'Natural Language Processing', 'Medical AI', 'Computer Vision'],
    publicationCount: 38,
    collaboratorCount: 12,
    citationCount: 645,
    hIndex: 15,
    bio: 'Applying deep learning to medical imaging and clinical text analysis.',
  },
  {
    id: '10',
    name: 'Prof. Dr. Selin Kaya',
    title: 'Professor',
    institution: 'Bilkent University',
    department: 'Molecular Biology and Genetics',
    researchInterests: ['Epigenetics', 'Chromatin Biology', 'Gene Regulation', 'Developmental Biology'],
    publicationCount: 104,
    collaboratorCount: 29,
    citationCount: 4123,
    hIndex: 36,
    bio: 'Understanding epigenetic mechanisms in development and disease.',
  }
];
export const mockCollaborations: Record<string, Collaboration[]> = {
  '1': [
    { scholarId: '2', strength: 8 },
    { scholarId: '3', strength: 5 },
    { scholarId: '4', strength: 3 },
    { scholarId: '5', strength: 4 },
  ],
  '2': [
    { scholarId: '1', strength: 8 },
    { scholarId: '3', strength: 6 },
    { scholarId: '6', strength: 4 },
  ],
  '3': [
    { scholarId: '1', strength: 5 },
    { scholarId: '2', strength: 6 },
    { scholarId: '7', strength: 7 },
  ],
  '4': [
    { scholarId: '1', strength: 3 },
    { scholarId: '5', strength: 5 },
  ],
  '5': [
    { scholarId: '1', strength: 4 },
    { scholarId: '4', strength: 5 },
    { scholarId: '8', strength: 6 },
  ],
};
export const mockSavedSearches = [
  {
    id: 's1',
    name: 'Genomics Researchers in Istanbul',
    filters: {
      keywords: 'genomics',
      institution: 'Istanbul',
    },
    resultCount: 12,
    createdAt: '2024-11-15',
  },
  {
    id: 's2',
    name: 'Machine Learning at Boğaziçi',
    filters: {
      keywords: 'machine learning',
      institution: 'Boğaziçi University',
    },
    resultCount: 8,
    createdAt: '2024-11-10',
  },
];
export const mockRecommendations = [
  {
    scholarId: '3',
    similarity: 0.92,
    matchedOn: ['genome assembly', 'bioinformatics'],
  },
  {
    scholarId: '5',
    similarity: 0.88,
    matchedOn: ['single-cell RNA-seq', 'network biology'],
  },
  {
    scholarId: '7',
    similarity: 0.85,
    matchedOn: ['metagenomics', 'bioinformatics'],
  },
];
export const mockDuplicates = [
  {
    id: 'd1',
    scholar1: {
      id: '2',
      name: 'Prof. Dr. Mehmet Yılmaz',
      institution: 'Middle East Technical University',
      department: 'Computer Engineering',
      publicationCount: 156,
      email: 'mehmet.yilmaz@metu.edu.tr',
    },
    scholar2: {
      id: '9',
      name: 'Prof. Dr. Mehmet Yılmaz',
      institution: 'ODTU',
      department: 'Computer Engineering',
      publicationCount: 142,
      email: 'myilmaz@metu.edu.tr',
    },
    similarity: 0.95,
    status: 'pending',
    reason: 'Same name, overlapping publications, same institution (ODTU = METU)',
  },
  {
    id: 'd2',
    scholar1: {
      id: '15',
      name: 'Dr. Zeynep Öztürk',
      institution: 'Ankara University',
      department: 'Molecular Biology',
      publicationCount: 45,
      email: 'zeynep.ozturk@ankara.edu.tr',
    },
    scholar2: {
      id: '16',
      name: 'Doç. Dr. Zeynep Öztürk',
      institution: 'Ankara Üniversitesi',
      department: 'Molecular Biology',
      publicationCount: 48,
      email: 'z.ozturk@ankara.edu.tr',
    },
    similarity: 0.92,
    status: 'pending',
    reason: 'Same person, title updated, identical institution',
  },
];
export const mockUserEdits = [
  {
    id: 'e1',
    userName: 'Dr. Emily Carter',
    userEmail: 'emily.carter@example.com',
    scholarId: '1',
    scholarName: 'Doç. Dr. Ayşe Demir',
    changes: {
      field: 'researchInterests',
      oldValue: 'Genomics, Bioinformatics, Cancer Research',
      newValue: 'Genomics, Bioinformatics, Cancer Research, Precision Medicine, Single-cell RNA-seq',
    },
    submittedAt: '2024-11-18',
    status: 'pending',
    justification: 'Updated research interests to reflect my current work on single-cell analysis.',
  },
  {
    id: 'e2',
    userName: 'Dr. Sophia Davis',
    userEmail: 'sophia.davis@example.com',
    scholarId: '3',
    scholarName: 'Prof. Dr. Ali Kaya',
    changes: {
      field: 'institution',
      oldValue: 'Boğaziçi University',
      newValue: 'Istanbul Technical University',
    },
    submittedAt: '2024-11-19',
    status: 'pending',
    justification: 'I moved to ITU in September 2024 as part of a new collaborative research center.',
  },
  {
    id: 'e3',
    userName: 'Dr. James Miller',
    userEmail: 'james.miller@example.com',
    scholarId: '5',
    scholarName: 'Dr. Sarah Johnson',
    changes: {
      field: 'title',
      oldValue: 'Assistant Professor',
      newValue: 'Associate Professor',
    },
    submittedAt: '2024-11-17',
    status: 'pending',
    justification: 'Promoted to Associate Professor as of November 2024.',
  },
];