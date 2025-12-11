# Backend API Response Format

## Endpoint: POST /analyze

Your backend should return JSON in this format:

```json
{
  "status": "success",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "cached": false,
  "data": {
    "metadata": {
      "sampleName": "sample_file.fasta",
      "totalSequences": 150,
      "processingTime": "3.2s",
      "avgConfidence": 87
    },
    "taxonomy_summary": [
      { "name": "Alveolata", "value": 45, "color": "#22D3EE" },
      { "name": "Chlorophyta", "value": 32, "color": "#10B981" },
      { "name": "Fungi", "value": 12, "color": "#A78BFA" },
      { "name": "Metazoa", "value": 28, "color": "#F59E0B" },
      { "name": "Rhodophyta", "value": 18, "color": "#EC4899" },
      { "name": "Unknown", "value": 15, "color": "#64748B" }
    ],
    "sequences": [
      {
        "accession": "SEQ_001",
        "taxonomy": "Alveolata; Dinoflagellata; Gymnodiniales",
        "length": 1842,
        "confidence": 0.94,
        "overlap": 87,
        "cluster": "C1"
      },
      {
        "accession": "SEQ_002",
        "taxonomy": "Chlorophyta; Chlorophyceae; Chlamydomonadales",
        "length": 1654,
        "confidence": 0.89,
        "overlap": 92,
        "cluster": "C2"
      }
    ],
    "cluster_data": [
      { "x": 12.5, "y": 8.3, "z": 45, "cluster": "Alveolata", "color": "#22D3EE" },
      { "x": -8.2, "y": 15.1, "z": 32, "cluster": "Chlorophyta", "color": "#10B981" },
      { "x": 3.4, "y": -12.7, "z": 28, "cluster": "Metazoa", "color": "#F59E0B" }
    ]
  }
}
```

## Field Descriptions

### Root Level Fields
- `status`: "success" or "error"
- `job_id`: Unique identifier for this analysis job (UUID format)
- `cached`: Boolean indicating if result was returned from cache
- `data`: The analysis results object

### metadata
- `sampleName`: Name of the uploaded file
- `totalSequences`: Total number of sequences analyzed
- `processingTime`: Time taken for analysis (e.g., "3.2s")
- `avgConfidence`: Average confidence score (0-100)

### taxonomy_summary
Array of taxonomy groups with:
- `name`: Taxonomy group name
- `value`: Count of sequences in this group
- `color`: Hex color for visualization

### sequences
Array of individual sequence results:
- `accession`: Sequence identifier (e.g., "SEQ_001")
- `taxonomy`: Full taxonomic classification (semicolon-separated)
- `length`: Sequence length in base pairs
- `confidence`: Confidence score (0.0 to 1.0)
- `overlap`: Overlap percentage with reference
- `cluster`: Cluster identifier (e.g., "C1", "N1" for novel)

### cluster_data
Array for UMAP/clustering visualization:
- `x`, `y`: 2D coordinates for plotting
- `z`: Size/count for bubble chart
- `cluster`: Cluster name
- `color`: Hex color for visualization

## Error Response

```json
{
  "status": "error",
  "message": "Description of what went wrong"
}
```

## Current Frontend Flow

1. User uploads file(s) in `UploadPage.tsx`
2. Frontend sends file to `${API_URL}/analyze` via POST with FormData
3. Backend processes and returns JSON in above format
4. Frontend saves to `localStorage.setItem('analysisResults', JSON.stringify(result.data))`
5. Frontend navigates to OutputPage
6. OutputPage reads from localStorage and displays results

## Testing Without Backend

If you want to test the UI without a backend, you can manually set localStorage:

```javascript
localStorage.setItem('analysisResults', JSON.stringify({
  metadata: {
    sampleName: "test_sample.fasta",
    totalSequences: 200,
    processingTime: "2.5s",
    avgConfidence: 91
  },
  taxonomy_summary: [
    { name: "Alveolata", value: 60, color: "#22D3EE" },
    { name: "Chlorophyta", value: 40, color: "#10B981" }
  ],
  sequences: [
    {
      accession: "TEST_001",
      taxonomy: "Alveolata; Test; Species",
      length: 1500,
      confidence: 0.95,
      overlap: 90,
      cluster: "C1"
    }
  ],
  cluster_data: [
    { x: 10, y: 5, z: 60, cluster: "Alveolata", color: "#22D3EE" }
  ]
}));
```
