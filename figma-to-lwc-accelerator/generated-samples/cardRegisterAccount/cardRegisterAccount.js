import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CardRegisterAccount extends LightningElement {
  // Input value for Input / Account Name.
  inputAccountNameValue = '';

  // Input value for Input / Email Address.
  inputEmailAddressValue = '';

  handleInputAccountNameChange(event) {
    this.inputAccountNameValue = event.target.value;
  }

  handleInputEmailAddressChange(event) {
    this.inputEmailAddressValue = event.target.value;
  }

  handleButtonRegisterAccountClick() {
    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Success',
        message: 'Action "Button / Register Account" executed successfully!',
        variant: 'success'
      })
    );
  }
}
