public with sharing class GenericDataTableController {
    @AuraEnabled(cacheable=true)
    public static Response getRecords(
        String objectApiName,
        String fields,
        String searchTerm,
        String sortField,
        String sortDirection,
        Integer pageSize,
        Integer pageNumber
    ) {
        try {
            // Validate input
            if (String.isBlank(objectApiName) || String.isBlank(fields)) {
                throw new IllegalArgumentException('Object API Name and Fields are required.');
            }

            // Get field descriptions and validate
            List<FieldDescription> fieldDescriptions = getFieldDescriptions(objectApiName, fields);

            // Build SOQL query
            String query = 'SELECT Id, ' + fields + ' FROM ' + objectApiName;

            // Add search term
            if (String.isNotBlank(searchTerm)) {
                query += ' WHERE Name LIKE \'%' + String.escapeSingleQuotes(searchTerm) + '%\'';
            }

            // Add sorting
            if (String.isNotBlank(sortField)) {
                query += ' ORDER BY ' + sortField + ' ' + sortDirection;
            }

            // Add pagination
            query += ' LIMIT :pageSize OFFSET :offset';
            Integer offset = (pageNumber - 1) * pageSize;

            // Execute query
            System.debug('Query: ' + query); // Debugging
            List<SObject> records = Database.query(query);
            Integer totalRecords = Database.countQuery('SELECT COUNT() FROM ' + objectApiName + (String.isNotBlank(searchTerm) ? ' WHERE Name LIKE \'%' + String.escapeSingleQuotes(searchTerm) + '%\'' : ''));

            // Prepare response
            Response response = new Response();
            response.records = records;
            response.totalRecords = totalRecords;
            response.fields = fieldDescriptions;
            return response;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching records: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void saveRecords(List<SObject> records) {
        try {
            update records; // Update the records
        } catch (Exception e) {
            throw new AuraHandledException('Error updating records: ' + e.getMessage());
        }
    }

    // Get field descriptions (label, apiName, type)
    private static List<FieldDescription> getFieldDescriptions(String objectApiName, String fields) {
        List<FieldDescription> fieldDescriptions = new List<FieldDescription>();
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap();
        for (String field : fields.split(',')) {
            Schema.SObjectField sobjectField = fieldMap.get(field.trim());
            if (sobjectField != null) {
                Schema.DescribeFieldResult fieldDescribe = sobjectField.getDescribe();
                fieldDescriptions.add(new FieldDescription(
                    fieldDescribe.getLabel(),
                    fieldDescribe.getName(),
                    String.valueOf(fieldDescribe.getType())
                ));
            }
        }
        return fieldDescriptions;
    }

    // Inner class for response
    public class Response {
        @AuraEnabled public List<SObject> records;
        @AuraEnabled public Integer totalRecords;
        @AuraEnabled public List<FieldDescription> fields;
    }

    // Inner class for field descriptions
    public class FieldDescription {
        @AuraEnabled public String label;
        @AuraEnabled public String apiName;
        @AuraEnabled public String type;
        public FieldDescription(String label, String apiName, String type) {
            this.label = label;
            this.apiName = apiName;
            this.type = type;
        }
    }
}