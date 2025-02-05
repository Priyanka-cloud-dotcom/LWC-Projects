import { LightningElement, api, wire, track } from 'lwc';
import getRecords from '@salesforce/apex/GenericDataTableController.getRecords';
import saveRecords from '@salesforce/apex/GenericDataTableController.saveRecords';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class GenericDataTable extends LightningElement {
    @api objectApiName = 'Account'; // Default object
    @api fields = 'Name,Industry,Phone'; // Default fields
    @api pageSize = 10;

    @track data = [];
    @track columns = [];
    @track searchTerm = '';
    @track sortedBy = '';
    @track sortedDirection = 'asc';
    @track currentPage = 1;
    @track totalPages = 1;
    @track totalRecords = 0;
    @track draftValues = []; // Track draft values for editable fields

    // Wire method to fetch records
    @wire(getRecords, {
        objectApiName: '$objectApiName',
        fields: '$fields',
        searchTerm: '$searchTerm',
        sortField: '$sortedBy',
        sortDirection: '$sortedDirection',
        pageSize: '$pageSize',
        pageNumber: '$currentPage'
    })
    wiredRecords({ error, data }) {
        if (data) {
            console.log('Data:', data); // Debugging
            this.data = data.records;
            this.totalRecords = data.totalRecords;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            this.columns = this.generateColumns(data.fields);
        } else if (error) {
            console.error('Error fetching records:', error);
        }
    }

    // Generate columns dynamically based on fields
    generateColumns(fields) {
        const columns = fields.map(field => ({
            label: field.label,
            fieldName: field.apiName,
            type: field.type,
            editable: true // Make fields editable
        }));
        console.log('Columns:', columns); // Debugging
        return columns;
    }

    // Handle sorting
    handleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        this.sortedBy = sortedBy;
        this.sortedDirection = sortDirection;
    }

    // Handle search
    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.currentPage = 1; // Reset to first page on search
    }

    // Handle pagination - Previous
    handlePrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    // Handle pagination - Next
    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    // Handle save for editable fields
    handleSave(event) {
        const draftValues = event.detail.draftValues;
        saveRecords({ records: draftValues })
            .then(() => {
                this.draftValues = []; // Clear draft values
                this.showToast('Success', 'Records updated successfully!', 'success');
                // Refresh data
                return refreshApex(this.wiredRecords);
            })
            .catch(error => {
                // Handle both Apex and non-Apex errors
                const errorMessage = error.body ? message : error.message || 'Unknown error';
                this.showToast('Error', 'Error updating records: ' + errorMessage, 'error');
            });
    }

    // Show toast message
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    // Computed properties for pagination buttons
    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }
}