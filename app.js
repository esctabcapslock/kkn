class SigData{
    constructor(){
        this.polyList = []
        this.value = 0
        this.mousedown = {
            time:null,
            clientX:0,
            clientY:0,
            overed:true
        }
    }

    add_poly(poly){
        this.polyList.push(poly)
    }
    value_change(){
        this.value++
        if(this.value>=6) this.value = 0
    }

    get_color(){
        return ['#ffffff',
        '#3f55ff',
        '#32fa67',
        '#faff79',
        '#f56d64',
        '#e87afd',
        ][this.value]
    }
    get_opt(){
        return this.value==0?0:0.8
    }

    isIgnoreMouseEvent(x,y){
        console.log('[isIgnoreMouseEvent]',this.mousedown.time, Date.now() - this.mousedown.time)
        if(!this.mousedown.time) return false
        if ((Date.now() - this.mousedown.time)>10000) return false
        if ((Date.now() - this.mousedown.time)>1000) return true
        const {clientX,clientY} = this.mousedown
        if (((clientX-x)**2 + (clientY-y)**2 ) > 10) return true
        return false
    }
}

class App{
    constructor(){
        const map = L.map('map').setView([36.5, 128], 6);
        this.map = map
        this.polyDict = {};

        this.cd_keys = []
        for(const key in cd) this.cd_keys.push(key)
        this.cd_keys.sort((a,b)=>a-b);
        for(const ele of document.getElementsByClassName('cd_ln')) ele.innerHTML = 5*this.cd_keys.length
        


        const before_search_parm =  (new URLSearchParams(location.search)).get('sig')
        if(before_search_parm){
            const data = this.decode(before_search_parm)
            console.log('bf data:',data)
            this.cd_keys.forEach((key,i)=>{
                if(!this.polyDict[key]) this.polyDict[key] = new SigData();
                this.polyDict[key].value = data[i]
            })
        }
        
        L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        // L.geoJson(border).addTo(map);
        

        
        border.features.map(v=>{
            if(!v.geometry.coordinates) return;
            const CD = v.properties.SIG_CD;
            if(!this.polyDict[CD]) this.polyDict[CD] = new SigData();
            const sigData = this.polyDict[CD]
            // console.log(v.geometry.coordinates.length, v.geometry.coordinates[0])

            const layerGroup = new L.LayerGroup().addTo(map);
            // console.log(layerGroup)
            layerGroup.on('click',e=>{
                console.log(e)
            })

            v.geometry.coordinates.map(e1=>{
                e1.map(e=>{
                    const polygon = L.polygon(e.map(a=>[a[1],a[0]]),{
                        fillOpacity:sigData.get_opt(),
                        color:'#000000',
                        stoke:true,
                        weight:1,
                        fillColor:sigData.get_color(),
                    }).addTo(layerGroup); //

                    // console.log('[polygon]',polygon)

                    
                    // this.polyDict[CD].push(polygon)
                    this.polyDict[CD].add_poly(polygon)
                    

                    // TODO mousedown 시간 비교해서 드래그면 이벤트 발생 안하기.

                    polygon._path.addEventListener('mouseover',e=>{
                        const sigData = this.polyDict[CD]
                        sigData.polyList.map(e=>{
                            e._path.attributes['stroke-width'].value = 2
                        })  
                    })

                    polygon._path.addEventListener('mouseout',e=>{
                        const sigData = this.polyDict[CD]
                        sigData.polyList.map(e=>{
                            e._path.attributes['stroke-width'].value = 1
                        })  
                    })

                    polygon._path.addEventListener('mousedown',e=>{
                        const sigData = this.polyDict[CD]
                        console.log(e)
                        sigData.mousedown.time = Number(Date.now())
                        sigData.mousedown.clientX = e.clientX
                        sigData.mousedown.clientY = e.clientY
                        sigData.mousedown.overed = false

                    })

                    polygon._path.addEventListener('mouseup',e=>{
                        console.log('mouseup')
                        const sigData = this.polyDict[CD]
                        sigData.mousedown.overed = true

                    })

                    polygon._path.addEventListener('dblclick',e=>{
                        console.log('dblclick')
                        e.preventDefault()
                        e.stopPropagation()

                    })

                    polygon._path.addEventListener('click',e=>{
                        console.log('click')
                        const sigData = this.polyDict[CD]

                        if(sigData.mousedown.overed && sigData.isIgnoreMouseEvent(e.clientX,e.clientY)) {
                            sigData.mousedown.time = null
                            return
                        }


                        sigData.value_change()
                        // console.log(CD,sigData,   sigData.get_color())
                        sigData.polyList.map(e=>{
                            e._path.attributes['fill'].value = sigData.get_color()
                            e._path.attributes['fill-opacity'].value = sigData.get_opt()
                        })
                        this.draw_visit_panal()
                        this.queryString_setup()
                        
                    })
                })
            })
        })
        this.draw_visit_panal();
        

    }

    draw_visit_panal(){
        const visit_panal = document.getElementById('visit_panal')

        const outList = [[],[],[],[],[],[]]
        for(const key in this.polyDict){
            const i = this.polyDict[key].value
            // console.log('i',i,((5-i)*2+1),key)
            if(!cd[key]) {console.error(cd[key],key,i,this.polyDict[key].polyList[0]._path,'없어'); return}
            outList[i].push(cd[key])
        }

        console.log(outList)

        function summary_output(temp1){
            const d_dict = {}
            temp1.map(v => {
                const sp = v.split(' ')
                const d = sp[0]
                const e = sp.splice(1).join(' ')
                if (!d_dict[d]) d_dict[d] = []
                d_dict[d].push(e)

            })
            let out = ''
            for (const key in d_dict) {
                const v = d_dict[key]
                out += `<details>
                        <summary>${key} (${v.length})</summary>
                        ${v.map(v => '<span class="vp_item">' + v + '</span>').join(' ')}
                    </details>`
            }
            return out
        }

        const score_list = document.querySelectorAll('#visit_panal .vp_hd>span:nth-child(3)>span:first-child')
        let total_score = 0
        for(let i=0; i<=5; i++){
            visit_panal.children[((5-i)*2+2)].innerHTML = `<span>${summary_output(outList[i])}</span>`//.map(v=>`<span>${v}</span>`).join(' ')
            // visit_panal.children[((5-i)*2+1)].innerHTML = outList[i].map(v=>`<span>${v}</span>`).join(' ')
            score_list[6-i].innerHTML = outList[i].length
            total_score += outList[i].length * i
        }
        score_list[0].innerHTML = total_score
        //
    }


    queryString_setup(){
        const a = this.cd_keys.map(key=>this.polyDict[key]?.value)
        console.log('[queryString_setup]',a)
        const d = this.encode(a)
        changeQueryString(`?sig=${d}`)
    }


    cut_bit(v,s,l){
        //어떤 값의 비트 자르기 
        // 000101011110
        //    s+l   s
        //    7     2  
        return (v>>s)&((1<<l)-1)
    }

    encode(ar){
        let out = ''
        let top = 0
        let last = 0

        
        const record = (c)=>{
            out+='_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789='[c]
        }
        const ar_get = i=>ar[i]?ar[i]:0
        for(let i=0; i<ar.length+4; i+=5){
            

            const v = ar_get(i+0)*1296
                    + ar_get(i+1)*216
                    + ar_get(i+2)*36
                    + ar_get(i+3)*6
                    + ar_get(i+4)
            // 0~13개 == 13개. 6개씩 잘라 버퍼로 생성
            // 3개 남음 + 13게.  top=3. last = 0x04
            const e = last*8192+v

            record(this.cut_bit(e,13+top-6, 6-top) + (1<<(6-top))*last)
            record(this.cut_bit(e,7+top-6, 6))
            if(1+top==6) {
                record(this.cut_bit(e,0,6))
                top = 0
                last = 0
            }else{
                last = this.cut_bit(e,0,1+top)
                top = 1 + top
            }
        }
        if(top) record((1<<(6-top))*last)

        return out
    }

    decode(str){
        // 13비트씩 자르기.
        let top = 0
        let last = 0

        const all_out = []

        // console.log('decde str:',str)
        // 하나는 6비트

        for(const c of str){
            const v = '_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789='.indexOf(c)
            top += 6
            last = last*(1<<6)+v

            while (top>=13){
                let oo = this.cut_bit(last, top-13,13)
                last = this.cut_bit(last, 0,top-13)
                // console.log('decode oo',{oo,top, last})
                top -= 13
                const out = []
                for(let i=0; i<5; i++) {
                    out.push(oo%6)
                    oo = (oo-oo%6)/6
                }
                // if(out.some(v=>v)) console.log('out out',out);
                while(out.length) all_out.push(out.pop())

            }
        }
        return all_out
    }
}


function changeQueryString(searchString, documentTitle){      
    documentTitle = typeof documentTitle !== 'undefined' ? documentTitle : document.title;      
    // var urlSplit=( window.location.href ).split( "?" );      
    var obj = { Title: documentTitle, Url: location.origin + location.pathname + searchString + location.hash };      
    history.pushState(obj, obj.Title, obj.Url);      
}