/* Current user I am getting from for looping the firstSheet */
let currentUser = {'First Name': 'Billy', 'Last Name': 'Bob', 'Member Number': 3333,'Home Phone': 9764582917, 'Cell Phone': 2345677123, 'Day Phone': 9928844574, 'Email': 'seeBill@gmail.com', 'plan price': '10.10' }

/* this is found from checking further in the first sheet by a small for loop that runs as it finds duplicates, ussaly there is only 1 object in this. There is a line per plan*/
let dupeArray = [{'First Name': 'Billy', 'Last Name': 'Bob', 'Member Number': 1111,'Home Phone': 9764582917, 'Cell Phone': 2345677123, 'Day Phone': 9928844574, 'Email': 'seeBill@gmail.com', 'plan Price': '10.10'  }]

let secondSheet = [
    {'First Name': 'Billy', 'Last Name': 'Bob', 'plan1': 1111, 'plan2': 2222, 'plan3': 3333, 'Home Phone': 9764582917, 'Cell Phone': 2345677123, 'Day Phone': 9928844574, 'Email': 'seeBill@gmail.com', 'plan1 Price': '10.10', 'plan2 Price': '10.10', 'plan3 Price': '10.10'  },
    {'First Name': 'Benny', 'Last Name': 'Socks', 'plan1': 5315, 'plan2': 5562, 'plan3': 3333, 'Home Phone': 1122331467, 'Cell Phone': 9867485926, 'Day Phone': 1759603752, 'Email': 'seeBennySocks@gmail.com', 'plan1 Price': '10.10', 'plan2 Price': '10.10', 'plan3 Price': '10.10'  },
    {'First Name': 'Sara', 'Last Name': 'Jones', 'plan1': 5645, 'plan2': 5522, 'plan3': 6678, 'Home Phone': 6672854673, 'Cell Phone': 7766552897, 'Day Phone': 9856301788, 'Email': 'seeSara@gmail.com', 'plan1 Price': '10.10', 'plan2 Price': '10.10', 'plan3 Price': '10.10'  },
    {'First Name': 'Jones', 'Last Name': 'Smith', 'plan1': 2344, 'plan2': 7766, 'plan3': 8763, 'Home Phone': 2221113323, 'Cell Phone': 7766552897, 'Day Phone': 1115566779, 'Email': 'seeJones@gmail.com', 'plan1 Price': '10.10', 'plan2 Price': '10.10', 'plan3 Price': '10.10'  },
]

let existingContacts;
let modalArray = [];
function handleUpdate(){
    existingContacts = secondSheet.filter((currContact) => {
        if( [currContact['plan1'], currContact['plan2'], currContact['plan3']].indexOf(currentUser['memberNumber']) > -1 || currContact['Email'] === currentUser['Email'] || currContact['Cell Phone'] === currentUser['Cell Phone'] ) {
            return true;
        } else {
            for (let a = 0; a < dupeArray.length; a++) {
                if([currContact['plan1'], currContact['plan2'], currContact['plan3'],].indexOf(dupeArray[a]['Member Number']) > -1) {
                    return true
                }
            }
            return false;
        }
    })
    if (existingContacts.length === 1) {return true;}
    else if (existingContacts.length > 1) { 
        for(let b=0; b < existingContacts.length; b++) {
            if([existingContacts[b]['plan1'], existingContacts[b]['plan2'], existingContacts[b]['plan3']].indexOf(currentUser['memberNumber']) > -1) {
                modalArray.push({ currentUserFirstName: currentUser['First Name'], currentUserlastName: currentUser['Last Name'],  issueFound: 'Member Number', currContactFirstName: existingContacts[b]['First Name'], currContactLastName: existingContacts[b]['Last Name']})
            
            } else if (existingContacts[b]['Email'] === currentUser['Email']) { 
                modalArray.push({ currentUserFirstName: currentUser['First Name'], currentUserlastName: currentUser['Last Name'],  issueFound: 'Email', currContactFirstName: existingContacts[b]['First Name'], currContactLastName: existingContacts[b]['Last Name']}) 
            
            } else if (existingContacts[b]['Cell Phone'] === currentUser['Cell Phone']) {
                modalArray.push({ currentUserFirstName: currentUser['First Name'], currentUserlastName: currentUser['Last Name'],  issueFound: 'Cell Phone', currContactFirstName: existingContacts[b]['First Name'], currContactLastName: existingContacts[b]['Last Name']}) 
            
            } else {
                for (let c = 0; c < dupeArray.length; c++) { // lol
                    if([existingContacts[b]['plan1'], existingContacts[b]['plan2'], existingContacts[b]['plan3'],].indexOf(dupeArray[c]['Member Number']) > -1) {
                        modalArray.push({ currentUserFirstName: currentUser['First Name'], currentUserlastName: currentUser['Last Name'],  issueFound: 'Member Number', currContactFirstName: existingContacts[b]['First Name'], currContactLastName: existingContacts[b]['Last Name']}) 
                    }
                }
            }
        }
        return false;
    }
    else { return false; }
}

console.log(handleUpdate())
/* This is just to explain why the function itself returns a boolean */
// filteredSheet.push({
//     ...(handleUpdate() && existingContacts[0]),
//     /* then I replace what i need to from currentUser here */
// })