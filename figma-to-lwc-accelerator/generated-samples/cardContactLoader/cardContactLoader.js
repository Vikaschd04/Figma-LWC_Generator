import { LightningElement, api } from 'lwc';
import getApexData from '@salesforce/apex/ContactDetailsPageControllerController.getData';

export default class CardContactLoader extends LightningElement {
  // The ID of the current Salesforce record.
  @api recordId;

  // Wired storage for server call responses.
  wiredData;
}
