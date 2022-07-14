let person = {
    name: 'Turing',
    sayName: function() { 
        
        setTimeout(function () {
            console.log(`i am a developer from ${this.name}`);
        }.bind(this), 1000);
    }
}

person.sayName()