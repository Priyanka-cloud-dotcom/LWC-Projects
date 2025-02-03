public with sharing class WorldClockController {
    @AuraEnabled
    public static String getTimeFromAPI(String location) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        
        // Set the API endpoint
        String apiUrl = 'https://api.timezonedb.com/v2.1/get-time-zone?key=GJWNK1NL8B85&format=json&by=zone&zone=' + location;
        request.setEndpoint(apiUrl);
        request.setMethod('GET');
        
        try {
            // Send the request
            HttpResponse response = http.send(request);
            if (response.getStatusCode() == 200) {
                // Parse the JSON response
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                return (String) result.get('formatted');
            } else {
                throw new AuraHandledException('Error fetching time: ' + response.getStatus());
            }
        } catch (Exception e) {
            throw new AuraHandledException('API call failed: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(Cacheable=true)
	public static List<String> getTimeZones() {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('https://api.timezonedb.com/v2.1/list-time-zone?key=GJWNK1NL8B85&format=json');
        request.setMethod('GET');
        
        HttpResponse response = http.send(request);
        if (response.getStatusCode() == 200) {
            // Parse the JSON response
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            List<Object> zones = (List<Object>) result.get('zones');
            
            // Extract time zone names
            List<String> timeZones = new List<String>();
            for (Object zone : zones) {
                Map<String, Object> zoneMap = (Map<String, Object>) zone;
                timeZones.add((String) zoneMap.get('zoneName'));
            }
            return timeZones;
        } else {
            throw new AuraHandledException('Error fetching time zones: ' + response.getStatus());
        }
    } 
}