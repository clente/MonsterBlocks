import ActorSheet5eNPC from "../../systems/dnd5e/module/actor/sheets/npc.js";

export class MonsterBlock5e extends ActorSheet5eNPC {
	constructor(...args) {
		super(...args);
		
		this.createHandlebarsHelpers();
	}

	get template() {
		return "modules/monsterblock/actor-sheet.html";
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["monsterblock", "sheet", "actor"],
		//	template: "modules/monsterblock/actor-sheet.html",
			width: 416,
			height: 800,
			tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
		});
	}
	
	getData() {
		const data = super.getData();
		data.flags = this.actor.data.flags.monsterblock;
		return data;
	}
	
	activateListeners(html) {
		html.find('.switch').click(this._onSwitch.bind(this));
	}
	
	toggleAttackDescription() {
		let flag = !this.actor.getFlag("monsterblock", "attack-descriptions");
		console.log(flag);
		this.actor.setFlag("monsterblock", "attack-descriptions", flag);
	}
	
	_onSwitch(event) {
		console.log(event);
		let control = event.target.dataset.control;
		switch (control) {
			case "attack-description": this.toggleAttackDescription(); break;
			default: console.warn(`Monster Block | ${control} is not a valid switch.`);
		}
	}
	isMultiAttack(item) {
		let name = item.name.toLowerCase().replace(/\s+/g, '');
		return [
			"multiattack",
			"extraattack",
			"extraattacks",
			"multiattacks",
			"multipleattacks",
			"manyattacks"
		].includes(name);
	}
	isLegendaryAction(item) {
		return item.data.activation.type === "legendary";
	}
	isLairAction(item) {
		return item.data.activation.type === "lair";
	}
	createHandlebarsHelpers() {
		Handlebars.registerHelper("hascontents", (obj)=> {
			return Object.keys(obj).length > 0;
		});

		Handlebars.registerHelper("hasskills", (skills)=> {
			for (let s in skills) {
				if (skills[s].value) return true;
			}
			return false;
		});
		Handlebars.registerHelper("hassave", (saves)=> {
			for (let s in saves) {
				if (saves[s].proficient) return true;
			}
			return false;
		});
		
		Handlebars.registerHelper("haslegendary", (features)=> {
			for (let feature of features) {
				if (feature.label == "Actions") {
					let items = feature.items;
					for (let item of items) {
						if (item.data.activation.type === "legendary") return true;
					}
				}
			}
			return false;
		});
		Handlebars.registerHelper("islegendary", (item)=> {
			return this.isLegendaryAction(item);
		});
		Handlebars.registerHelper("getmultiattack", (features)=> {
			for (let feature of features) {
				let items = feature.items;
				for (let item of items) {
					if (this.isMultiAttack(item)) return item;
				}
			}
			return false;
		});
		Handlebars.registerHelper("notspecialaction", (item)=> {
			// Handlebars has no negation in conditions afik, so we have to create one.
			return !(this.isMultiAttack(item) || this.isLegendaryAction(item) || this.isLairAction(item));
		});
		Handlebars.registerHelper("getattacks", (features)=> {
			for (let feature of features) {
				if (feature.label == "Attacks") return feature.items;
			}
		});
		Handlebars.registerHelper("getactions", (features)=> {
			for (let feature of features) {
				if (feature.label == "Actions") return feature.items;
			}
		});
		Handlebars.registerHelper("getfeatures", (features)=> {
			for (let feature of features) {
				if (feature.label == "Features") return feature.items;
			}
		});
		Handlebars.registerHelper("getattacktype", (attack)=> {
			return "DND5E.Action" + attack.data.actionType.toUpperCase();
		});
		Handlebars.registerHelper("getattackbonus", (attack, data)=> {
			let attr = attack.data.ability;
			let abilityBonus = data.abilities[attr].mod;
			let isProf = attack.data.proficient;
			let profBonus = data.attributes.prof;
		//	console.debug(attr, abilityBonus, isProf, profBonus);
			
			return abilityBonus + (isProf ? profBonus : 0);
		});
		Handlebars.registerHelper("getchathtml", (item, actor)=> {
			return game.actors.get(actor._id).getOwnedItem(item._id).getChatData().description.value;
		});
		Handlebars.registerHelper("enrichhtml", (str)=> {
			return TextEditor.enrichHTML(str, {secrets: true});
		});		
	}
}

Hooks.on("init", () => {
	console.log(`Monster Block | %cInitialized.`, "color: orange");
});

Hooks.on("renderActorSheet", ()=> {
	let template = "modules/monsterblock/actor-sheet.html";
    delete _templateCache[template];
    console.debug(`Monster Block | removed "${template}" from _templateCache.`);
})

Hooks.on("renderMonsterBlock5e", (monsterblock, html, data)=> {
	console.debug(`Monster Block |`, monsterblock, html, data);
	
	let popup = monsterblock._element[0];
	let anchorPosL = popup.querySelector("#endAnchor").offsetLeft;
	let anchorPosT = popup.querySelector("#endAnchor").offsetTop;
		
	popup.style.width = anchorPosL + 408 + "px";
	
	// Working on a more dynamic maximum height // let h = window.innerHeight - 72; // 72px Keeps the popup from covering the macro bar, plus some padding.
	let h = monsterblock.options.height;
	let w = monsterblock.options.width;
	
	if (anchorPosT < h) {
		let shrink = (h - anchorPosT) / 2;
		let nh = h - shrink;
		if (anchorPosL < w) nh = anchorPosT;
		popup.style.height = nh + 38 + "px";
	}
});

Actors.registerSheet("dnd5e", MonsterBlock5e, {
    types: ["npc"],
    makeDefault: false
});

