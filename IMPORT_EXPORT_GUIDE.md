# 📦 Import & Export Guide

This guide explains how to use the comprehensive import/export functionality integrated into your Weaviate GUI.

## 🌟 Features Overview

### ✅ What's Included
- **Collection Export** - Export individual collections to JSON/CSV
- **Bulk Import** - Import data from JSON files with schema creation
- **Full Backup/Restore** - Complete database backup and restore
- **Quick Export** - One-click export from collections list
- **Vector Support** - Optional inclusion of embeddings in exports
- **Progress Tracking** - Real-time feedback for all operations

## 📤 Export Functionality

### Individual Collection Export

1. **From Collections List:**
   - Click the "📤 Export" button on any collection
   - Downloads JSON file immediately (1000 objects, no vectors)

2. **From Import/Export Panel:**
   - Select collection from dropdown
   - Choose format (JSON/CSV)
   - Set object limit (1-10,000)
   - Toggle vector inclusion
   - Click "Export Collection"

### Export Formats

#### JSON Format (Recommended)
```json
{
  "collection": "Documents",
  "schema": { /* Full schema definition */ },
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "totalObjects": 1500,
  "includeVectors": true,
  "objects": [
    {
      "_additional": {
        "id": "uuid-here",
        "creationTimeUnix": 1705312200,
        "lastUpdateTimeUnix": 1705312200,
        "_vectors": [0.1, -0.2, 0.3, ...]
      },
      "title": "Document Title",
      "content": "Document content...",
      "category": "research"
    }
  ]
}
```

#### CSV Format
- Flat structure with metadata columns
- Arrays converted to semicolon-separated values
- Objects converted to JSON strings
- Suitable for spreadsheet analysis

## 📥 Import Functionality

### Supported Import Formats

1. **Weaviate GUI JSON** - Files exported from this tool
2. **Compatible JSON** - Must include `collection`, `objects` array
3. **Custom JSON** - With proper structure mapping

### Import Options

#### Schema Handling
- **Create Schema**: Automatically create collection if it doesn't exist
- **Use Existing**: Import into existing collection only

#### Data Handling
- **Append Mode**: Add to existing data (default)
- **Replace Mode**: ⚠️ Delete existing collection and recreate

### Import Process

1. **Select File**: Choose JSON file from your computer
2. **Configure Options**: 
   - Enable schema creation if needed
   - Enable replace mode if desired (destructive)
3. **Import**: Click "Import Data" and wait for completion
4. **Review Results**: Check import statistics and error details

### Import Results
```
Import Results:
├── Collection: Documents
├── Total Objects: 1,500
├── Imported: 1,487
├── Failed: 13
└── Errors: [Network timeout, Invalid property type, ...]
```

## 💾 Backup & Restore

### Full Database Backup

1. **Create Backup:**
   - Enter unique backup ID
   - Select storage backend (filesystem/S3/GCS)
   - Click "Create Backup"
   - Wait for completion

2. **Restore Backup:**
   - Enter existing backup ID
   - Select matching storage backend
   - Confirm destructive operation
   - Click "Restore Backup"

### Storage Backends

#### Filesystem (Default)
- Stores backups locally in Docker container
- Path: `/tmp/weaviate-backups/`
- Best for development and testing

#### Cloud Storage (S3/GCS)
- Requires additional configuration
- Suitable for production environments
- Persistent across container restarts

## 🔄 API Endpoints

### Export APIs
```bash
# Export collection as JSON
GET /api/export/Documents?format=json&includeVectors=true&limit=1000

# Export collection as CSV
GET /api/export/Documents?format=csv&limit=5000
```

### Import API
```bash
# Import data from JSON file
POST /api/import
Content-Type: multipart/form-data

file: [JSON file]
createSchema: true
replaceExisting: false
```

### Backup APIs
```bash
# Create backup
POST /api/backup
{
  "backupId": "my-backup-2024",
  "backend": "filesystem"
}

# Get backup status
GET /api/backup?backupId=my-backup-2024&backend=filesystem

# Restore backup
POST /api/restore
{
  "backupId": "my-backup-2024",
  "backend": "filesystem"
}
```

## 📋 Best Practices

### For Development
1. Use **JSON format** for full fidelity exports
2. **Include vectors** for complete data preservation
3. Use **filesystem backend** for backups
4. Test imports on small datasets first

### For Production
1. Create **regular backups** before major changes
2. Use **cloud storage backends** for backups
3. **Validate imports** in staging environment first
4. Monitor **import results** for data quality

### Performance Tips
1. **Batch size**: Large imports are processed in 100-object batches
2. **Limit exports**: Use reasonable limits for large collections
3. **Vector inclusion**: Only include vectors when necessary (larger files)
4. **Network timeouts**: Allow extra time for large operations

## 🚨 Important Warnings

### Destructive Operations
- ⚠️ **Replace Mode**: Deletes existing collection completely
- ⚠️ **Restore Backup**: Overwrites current database state
- ⚠️ **Schema Creation**: May fail if properties conflict

### Data Validation
- **Property Types**: Must match between import and schema
- **Required Fields**: All required properties must be present
- **Vector Dimensions**: Must match collection configuration

### Docker Considerations
- **Volume Mounts**: Ensure backup directories are properly mounted
- **Container Restart**: Filesystem backups may be lost without volumes
- **Network Access**: Cloud backends require internet connectivity

## 🔍 Troubleshooting

### Common Import Errors

#### "Collection does not exist"
**Solution**: Enable "Create Schema" option or create collection manually

#### "Invalid property type"
**Solution**: Check data types match collection schema

#### "Network timeout"
**Solution**: Reduce batch size or increase timeout limits

### Common Export Errors

#### "Collection not found"
**Solution**: Verify collection name and ensure it exists

#### "GraphQL query failed"
**Solution**: Check collection schema and property names

### Common Backup Errors

#### "Backup path not found"
**Solution**: Ensure Docker volumes are properly configured

#### "Permission denied"
**Solution**: Check file system permissions in container

## 📊 Usage Examples

### Complete Migration Workflow

1. **Export from Source:**
   ```bash
   # Export all collections
   for collection in Documents Products Users; do
     curl "http://localhost:3000/api/export/$collection?format=json&includeVectors=true" \
       -o "${collection}_export.json"
   done
   ```

2. **Import to Target:**
   ```bash
   # Import each collection
   for file in *_export.json; do
     curl -X POST http://localhost:3000/api/import \
       -F "file=@$file" \
       -F "createSchema=true"
   done
   ```

### Backup Automation

```bash
#!/bin/bash
# Daily backup script
BACKUP_ID="daily-$(date +%Y%m%d)"

curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d "{\"backupId\":\"$BACKUP_ID\",\"backend\":\"filesystem\"}"
```

---

## 🎯 Quick Reference

| Operation | Format | Includes Vectors | Best For |
|-----------|--------|------------------|----------|
| **Quick Export** | JSON | No | Fast downloads |
| **Full Export** | JSON | Yes | Complete backup |
| **Analysis Export** | CSV | No | Spreadsheet analysis |
| **Migration Import** | JSON | Yes | Moving data |
| **Backup/Restore** | Binary | Yes | Full database |

Need help? The GUI provides real-time feedback and error messages for all operations!
