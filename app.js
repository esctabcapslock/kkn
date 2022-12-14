class SigData{
    constructor(){
        this.polyList = []
        this.polyGroup = null
        this.value = 0
        this.mousedown = {
            time:null,
            clientX:0,
            clientY:0,
            overed:true
        }
        this.select_panal_ele = null
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
        // console.log('[isIgnoreMouseEvent]',this.mousedown.time, Date.now() - this.mousedown.time)
        if(!this.mousedown.time) return false
        if ((Date.now() - this.mousedown.time)>10000) return false
        if ((Date.now() - this.mousedown.time)>1000) return true
        const {clientX,clientY} = this.mousedown
        if (((clientX-x)**2 + (clientY-y)**2 ) > 10) return true
        return false
    }


    draw_map(){
        this.polyList.map(e=>{
            e._path.attributes['fill'].value = this.get_color()
            e._path.attributes['fill-opacity'].value = this.get_opt()
        })
    }

    draw_panal(){
        // console.log('draw_panal',this.select_panal_ele,this.value)
        const inputs = [...this.select_panal_ele.getElementsByTagName('input')]
        inputs[5-this.value].checked=true
    }

    focus_on(map){
        map.fitBounds(this.polyList[0].getBounds());
        document.documentElement.scrollTo(0,document.getElementById('map').offsetTop-15)
    }
}

class App{
    constructor(){
        const map = L.map('map').setView([36.5, 128], 6);
        this.map = map
        this.polyDict = {};

        // 시군구 cd값 모아놓은 배열
        this.cd_keys = []
        for(const key in cd) this.cd_keys.push(key)
        this.cd_keys.sort((a,b)=>a-b);
        for(const ele of document.getElementsByClassName('cd_ln')) ele.innerHTML = 5*this.cd_keys.length
        
        // 시/도별 모아놓은 딕셔너리 만들기
        /** @type {[key:string:{name:string, cd:string}[]]} */
        this.city_dict = {}
        this.cd_keys.map(key => {
            const v = cd[key]
            const sp = v.split(' ')
            const d = sp[0]
            const e = sp.splice(1).join(' ')
            if (!this.city_dict[d]) this.city_dict[d] = []
            this.city_dict[d].push({name:e, cd:key})
        })

        // 위치 설정
        document.getElementById('url_copy_input').value = location
        document.getElementById('url_copy_btn').addEventListener('click',e=>{
            copy2(location)
            e.target.focus()
        })

        

        const before_search_parm =  (new URLSearchParams(location.search)).get('sig')
        if(before_search_parm){
            try{
                const data = this.decode(before_search_parm)
                console.log('bf data:',data)
                this.cd_keys.forEach((key,i)=>{
                    if(!this.polyDict[key]) this.polyDict[key] = new SigData();
                    this.polyDict[key].value = data[i]
                })
            }catch(e){
                console.log('error!',e)
                alert('잘못된 기록 형식입니다.')
            }
            
        }
        
        L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, {
            maxZoom: 19,
            // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        this.map.attributionControl.options.prefix = 'kkn.esclock.net'
        this.map.attributionControl.addAttribution('&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>')

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

            sigData.polyGroup = layerGroup
            let coordinates = []
            for(const coordinate of v.geometry.coordinates){
                for(const item of coordinate) coordinates.push(item)
            }

            // console.log(coordinates)

            // console.log('[coordinates]',coordinates)
            coordinates = coordinates.map(e=>e.map(a=>[a[1],a[0]]))

            // v.geometry.coordinates.map(e1=>{
                // e1.map(e=>{
                    // console.log('e1',e1)
                    const polygon = L.polygon(coordinates,{
                    // const polygon = L.polygon(e.map(a=>[a[1],a[0]]),{
                        fillOpacity:sigData.get_opt(),
                        color:'#000000',
                        stoke:true,
                        weight:1,
                        fillColor:sigData.get_color(),
                    }).addTo(layerGroup); //

                    // console.log('[polygon]',polygon)

                    
                    // this.polyDict[CD].push(polygon)
                    this.polyDict[CD].add_poly(polygon)

                    polygon._path.classList.add('map_interactive_no_pointer')
                    polygon._path.setAttribute('data-cd',CD)
                    

                    // TODO mousedown 시간 비교해서 드래그면 이벤트 발생 안하기.

                    polygon._path.addEventListener('pointerdown',e=>{
                        const sp = cd[CD].split(' ')
                        this.map_dropdown_drow(sp[0], sp.splice(1).join(' '))
                    })


                    polygon._path.addEventListener('mouseover',e=>{
                        const sigData = this.polyDict[CD]
                        sigData.polyList.map(e=>{
                            e._path.attributes['stroke-width'].value = 2
                        })
                        // map_dropdown_drow
                        

                        const sp = cd[CD].split(' ')
                        this.map_dropdown_drow(sp[0], sp.splice(1).join(' '))

                    })

                    polygon._path.addEventListener('mouseout',e=>{
                        const sigData = this.polyDict[CD]
                        sigData.polyList.map(e=>{
                            e._path.attributes['stroke-width'].value = 1
                        })  
                    })

                    polygon._path.addEventListener('mousedown',e=>{
                        const sigData = this.polyDict[CD]
                        // console.log(e)
                        sigData.mousedown.time = Number(Date.now())
                        sigData.mousedown.clientX = e.clientX
                        sigData.mousedown.clientY = e.clientY
                        sigData.mousedown.overed = false

                    })

                    polygon._path.addEventListener('mouseup',e=>{
                        // console.log('mouseup')
                        const sigData = this.polyDict[CD]
                        sigData.mousedown.overed = true

                    })

                    polygon._path.addEventListener('dblclick',e=>{
                        console.log('dblclick')
                        e.preventDefault()
                        e.stopPropagation()

                    })

                    polygon._path.addEventListener('click',e=>{
                        // console.log('click')
                        const sigData = this.polyDict[CD]

                        if(sigData.mousedown.overed && sigData.isIgnoreMouseEvent(e.clientX,e.clientY)) {
                            sigData.mousedown.time = null
                            return
                        }


                        sigData.value_change()
                        // console.log(CD,sigData,   sigData.get_color())
                        sigData.draw_map()
                        sigData.draw_panal()
                        this.draw_visit_panal()
                        // this.draw_select_panal()
                        this.queryString_setup()
                        
                    // })
                // })
            })
        })
        this.draw_visit_panal();
        this.draw_select_panal()

        // 지도 시도설정
        this.map_dropdown_drow_init()

        document.getElementById('select_panal').addEventListener('change',e=>{
            // console.log(e,e.target)
            // const cd = e.target.attributes['data-cd']
            // if(!cd) return>
            const ar = [...document.querySelectorAll('#select_panal div.prov>div.select_panal>div:not(div:first-child)')]
            if(!ar) throw('오류')
            ar.forEach(ele=>{
                // console.log('ele',ele)
                const cd = ele.attributes['data-cd'].value
                const inputs = [...ele.getElementsByTagName('input')]
                if(!inputs) throw('오류')
                const value = 5-inputs.map(v=>v.checked).indexOf(true)
                const sigData = this.polyDict[cd]
                if(!sigData) throw('오류')
                if(sigData.value!=value){
                    sigData.value=value
                    sigData.draw_map()
                    
                }

            })
            this.draw_visit_panal()
            this.queryString_setup()

        })

        const save_as_png_btn =  document.getElementById('save_as_png_btn') 
        save_as_png_btn.addEventListener('click',()=>{
            save_as_png_btn.innerText = '저장중...'
            save_as_png_btn.classList.add('disabled')

            const div = document.createElement('div')
            div.innerHTML = svgHTML
            const svg = div.getElementsByTagName('svg')[0]
            const paths = [...svg.getElementsByTagName('path')]
            paths.forEach(ele=>{
                const cd = ele.attributes['data-cd'].value
                ele.attributes['fill'].value = app.polyDict[cd].get_color()
                // console.log('cd:',cd,ele.attributes['fill'].value)
            })
            const svgData = new XMLSerializer().serializeToString( svg );

            const save_callback = ()=>{
                save_as_png_btn.innerText = 'png로 내보내기'
                save_as_png_btn.classList.remove('disabled')
            }


            try{
                savePngFromSvg(svgData, 3600, 3600, 3,save_callback)
            }catch(e){
                console.log('error: e1',e)
                alert('png 저장 중 오류가 발생했습니다.\n이미지 크기를 줄여 다시 시도합니다.')
                try{
                    savePngFromSvg(svgData, 3600, 3600, 1,save_callback)
                }catch(e){
                    console.log('error: e2',e)
                    alert('png 저장 중 오류가 발생했습니다.\n저장을 취소합니다.')
                    save_callback()
                }
            }
        })


        const save_as_svg_btn =  document.getElementById('save_as_svg_btn') 
        save_as_svg_btn.addEventListener('click',()=>{
            save_as_svg_btn.innerText = '저장중...'
            save_as_svg_btn.classList.add('disabled')

            const div = document.createElement('div')
            div.innerHTML = svgHTML
            const svg = div.getElementsByTagName('svg')[0]
            const paths = [...svg.getElementsByTagName('path')]
            paths.forEach(ele=>{
                const cd = ele.attributes['data-cd'].value
                ele.attributes['fill'].value = app.polyDict[cd].get_color()
                // console.log('cd:',cd,ele.attributes['fill'].value)
            })

            const download = document.createElement('a');
            download.href = 'data:image/svg+xml/svg;base64,'+btoa(div.innerHTML)
            download.download = 'map.svg';
            download.click();
            save_as_svg_btn.innerText = 'svg로 저장'
            save_as_svg_btn.classList.remove('disabled')
        })
        

    }


    __summary_output(temp1){
        const d_dict = {}
        temp1.map(v => {
            const sp = v.name.split(' ')
            const d = sp[0]
            const e = sp.splice(1).join(' ')
            if (!d_dict[d]) d_dict[d] = []
            d_dict[d].push({name:e, cd:v.cd})

        })
        let out = []
        for (const key in d_dict) {
            const v = d_dict[key]
            const details = document.createElement('details')
            details.innerHTML = `<summary>${key} (${v.length})</summary>`
            for(const item of v){
                const span = document.createElement('span')
                span.classList.add('vp_item')
                span.innerText = item.name
                const clickEventLisner = _e=>this.focus_on(key, item.name, item.cd)
                span.addEventListener('click',clickEventLisner)
                details.appendChild(span)
            }
            out.push(details)
        }
        return out
    }


    draw_visit_panal(){
        const visit_panal = document.getElementById('visit_panal')

        const outList = [[],[],[],[],[],[]];
        for(const key in this.polyDict){
            const i = this.polyDict[key].value
            if(i===undefined) {console.error("이상"); continue}
            // console.log('i',i,((5-i)*2+1),key)
            if(!cd[key]) {console.error(cd[key],key,i,this.polyDict[key].polyList[0]._path,'없어'); return}
            // console.log('outlist',outList,i)
            outList[i].push({name:cd[key], cd:key})
        }

        // console.log(outList)

        

        const score_list = document.querySelectorAll('#visit_panal .vp_hd>span:nth-child(3)>span:first-child')
        let total_score = 0
        for(let i=0; i<=5; i++){
            const span = document.createElement('span')
            this.__summary_output(outList[i]).forEach(ele=>span.appendChild(ele))
            removeChilds(visit_panal.children[((5-i)*2+2)])
            visit_panal.children[((5-i)*2+2)].append(span)
            // visit_panal.children[((5-i)*2+1)].innerHTML = outList[i].map(v=>`<span>${v}</span>`).join(' ')
            score_list[6-i].innerHTML = outList[i].length
            total_score += outList[i].length * i
        }
        score_list[0].innerHTML = total_score
        //
    }


    draw_select_panal(){
        const province_panal = (pname, list) => {
            return ` <div class="prov card pd-4 my-4">
                <h5 class="my-3 mx-4">${pname}</h5>
                <div id="" class="select_panal">
                    <div>
                        <span>시/군/구</span>
                        <span data-bs-toggle="tooltip" title="더블클릭하여 모두 선택" ondblclick="app.select_all_by_province('${pname}',5)">거주</span>
                        <span data-bs-toggle="tooltip" title="더블클릭하여 모두 선택" ondblclick="app.select_all_by_province('${pname}',4)">숙박</span>
                        <span data-bs-toggle="tooltip" title="더블클릭하여 모두 선택" ondblclick="app.select_all_by_province('${pname}',3)">방문</span>
                        <span data-bs-toggle="tooltip" title="더블클릭하여 모두 선택" ondblclick="app.select_all_by_province('${pname}',2)">접지</span>
                        <span data-bs-toggle="tooltip" title="더블클릭하여 모두 선택" ondblclick="app.select_all_by_province('${pname}',1)">통과</span>
                        <span data-bs-toggle="tooltip" title="더블클릭하여 모두 선택" ondblclick="app.select_all_by_province('${pname}',0)">없음</span>
                    </div>
                    ${list.map((city,i)=>
                        `<div data-cd=${city.cd}>
                            <span data-bs-toggle="tooltip" title="더블클릭하여 이동" ondblclick="app.focus_on('${pname}','${city.name}', '${city.cd}')">${city.name/*.split(' ').map(v=>` ${v} `).join('&nbsp;')*/}</span>
                            <span><label><input type="radio" name="local-${pname}-${i}" value="5" ${city.value==5?"checked":''}></label></span>
                            <span><label><input type="radio" name="local-${pname}-${i}" value="4" ${city.value==4?"checked":''}></label></span>
                            <span><label><input type="radio" name="local-${pname}-${i}" value="3" ${city.value==3?"checked":''}></label></span>
                            <span><label><input type="radio" name="local-${pname}-${i}" value="2" ${city.value==2?"checked":''}></label></span>
                            <span><label><input type="radio" name="local-${pname}-${i}" value="1" ${city.value==1?"checked":''}></label></span>
                            <span><label><input type="radio" name="local-${pname}-${i}" value="0" ${city.value==0?"checked":''}></label></span>
                        </div>`
                    ).join('')}
                </div>
            </div>`
        }

        this.cd_keys

        const d_dict = {}
        this.cd_keys.map(key => {
            const v = cd[key]
            const sp = v.split(' ')
            const d = sp[0]
            const e = sp.splice(1).join(' ')
            if (!d_dict[d]) d_dict[d] = []
            d_dict[d].push({name:e, cd:key, value:this.polyDict[key].value})
        })
        let out = []
        for (const key in d_dict) {
            const v = d_dict[key]
            out.push(province_panal(key, v))
        }
        // document.getElementById('select_panal').innerHTML = out
        const p_ar = [...document.querySelectorAll('#select_panal>div')]
        const min_ind = ar=>ar.indexOf(Math.min(...ar))
        
        //균형 맞추어 업로드
        for(const html of out){
            const min =  min_ind(p_ar.map(v=>v.innerHTML.length))
            // console.log(html, min)
            p_ar[min].innerHTML += html
        }

        
        // select_panal_ele 등록
        const local_ar = [...document.querySelectorAll('div.select_panal>div:not(div:first-child)')]
        if(!local_ar) throw('err')
        local_ar.map(ele=>{
            const cd = ele.attributes['data-cd'].value
            this.polyDict[cd].select_panal_ele = ele
        })

        apply_tooltip()

    }

    queryString_setup(){
        const a = this.cd_keys.map(key=>this.polyDict[key]?.value)
        console.log('[queryString_setup]',a)
        const d = this.encode(a)
        changeQueryString(`?sig=${d}`)
        document.getElementById('url_copy_input').value = location
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
            out+='_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$'[c]
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
            const v = '_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$'.indexOf(c)
            if(v==-1) throw('이상한 문자')
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


    /**
     * 
     * @param {string} p - 도 이름 
     * @param {number} score - 점수
     */
    select_all_by_province(p,score){
        console.log('[select_all_by_province]',p,score)
        if(!this.city_dict[p]) throw('잘못됨')
        this.city_dict[p].forEach(city=>{
            const sigData = this.polyDict[city.cd]
            if(!sigData) throw(`에러, 도시명:${city.name}`)
            console.log('sigdata',sigData)
            sigData.value = score
            sigData.draw_map()
            sigData.draw_panal()
        })
        this.draw_visit_panal()
    }

    map_dropdown_drow_init(){

        // 레이어 관련 정리

        const map_tool_basemap_switch = document.getElementById('map_tool_basemap_switch')
        const basemapClickEventLisner = ()=>this.hide_basemap(!map_tool_basemap_switch.checked)
        basemapClickEventLisner() // 선택 상태에 맞게 초기화
        map_tool_basemap_switch.addEventListener('click',basemapClickEventLisner)

        // 시군구 경계파일 설정
        const provinceBound = {}
        for (const province in this.city_dict){
            const ne = {lat:0,lng:0}
            const sw = {lat:90,lng:180}
            this.city_dict[province].forEach(city=>{
            const {_northEast, _southWest} = this.polyDict[city.cd].polyList[0].getBounds()
                    // console.log(_northEast, _southWest)
                    ne.lat = Math.max(ne.lat, _northEast.lat)
                    ne.lng = Math.max(ne.lng, _northEast.lng)
                    sw.lat = Math.min(sw.lat, _southWest.lat)
                    sw.lng = Math.min(sw.lng, _southWest.lng)
            });
            provinceBound[province] = L.latLngBounds(L.latLng(ne.lat, ne.lng), L.latLng(sw.lat, sw.lng))
        }
        const map_tool_location_p_ul = document.querySelector('#map_tool_location_p_ul')
        const map_tool_location_l_ul =  document.getElementById('map_tool_location_l_ul')
        const map_tool_location_l_btn =  document.getElementById('map_tool_location_l_btn')
        removeChilds(map_tool_location_p_ul)
        for(const province in this.city_dict){
            // console.log('key',key,map_tool_location_p_ul)
            const li = document.createElement('li')
            li.innerHTML = `<span class="dropdown-item">${province}</span>`
            const clickEventLisner = e=>{
                this.map_dropdown_drow(province,'')
                console.log('provinceBound[province]',provinceBound[province])
                e.preventDefault()
                e.stopPropagation()
                map_tool_location_l_btn.click()
                this.map.fitBounds(provinceBound[province]);
            }
            li.addEventListener('click',clickEventLisner)
            map_tool_location_p_ul.appendChild(li)
        }
        map_tool_location_l_ul.innerHTML = '<span class="dropdown-item disabled">시/도 선택되지 않음</span>'
    }
    // 시도명. 시군구명
    /** 
     * @param {string} p - 시/도 명
     * @param {string} l - 시/군/구 명
    */
    map_dropdown_drow(p, l){
        // const map_tool_location_p_ul = document.querySelector('#map_tool_location_p_ul')
        const map_tool_location_l_ul =  document.getElementById('map_tool_location_l_ul')
        const map_tool_location_p_btn = document.getElementById('map_tool_location_p_btn')
        const map_tool_location_l_btn = document.getElementById('map_tool_location_l_btn')


        if(map_tool_location_l_ul.style.transform) return // 시/군/구 선택중이면, 반영하지 말고 기다리기.

        map_tool_location_p_btn.innerText = this.city_dict[p] ? p : '시/도'
        map_tool_location_l_btn.innerText = l ? l :'시/군/구'
        if(this.city_dict[p]){
            removeChilds(map_tool_location_l_ul)
            this.city_dict[p].map(local=>{
                // console.log('local',local)
                const li = document.createElement('li')
                li.innerHTML = `<span class="dropdown-item">${local.name}</span>`
                const clickEventLisner = _e=>this.focus_on(p, local.name, local.cd)
                li.addEventListener('click',clickEventLisner)
                map_tool_location_l_ul.appendChild(li)
            })
            
        }else{
            map_tool_location_l_ul.innerHTML = '<span class="dropdown-item disabled">시/도 선택되지 않음</span>'
        }

    }

    /**
     * 
     * @param {string} p - 도명
     * @param {string} l - 시명
     * @param {number} cd - cd값
     */
    focus_on(p,l,cd){
        const sigData = this.polyDict[cd]
        sigData.focus_on(this.map)
        this.map_dropdown_drow(p,l)
    }


    hide_basemap(flag){
        [...document.getElementsByClassName('leaflet-tile-pane')].map(ele=>ele.style.opacity=flag?0:'')
    }
}


function changeQueryString(searchString, documentTitle){      
    documentTitle = typeof documentTitle !== 'undefined' ? documentTitle : document.title;      
    // var urlSplit=( window.location.href ).split( "?" );      
    var obj = { Title: documentTitle, Url: location.origin + location.pathname + searchString + location.hash };      
    history.pushState(obj, obj.Title, obj.Url);      
}


function copy2(val) {
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = val;
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
  }

const removeChilds = (parent) => {
    while (parent.lastChild) {
        parent.removeChild(parent.lastChild);
    }
};

const apply_tooltip = ()=>{
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(tooltipTriggerEl=>new bootstrap.Tooltip(tooltipTriggerEl))
}

// 랜덤 선택 코드
/*
    [...document.querySelectorAll('#select_panal input')].forEach(ele=>{
        if(Math.random()>0.2) return;
        ele.checked=true
    })
*/



function savePngFromSvg(svgData, width, height, scale, callBack){
    console.log('[savePngFromSvg]')
    const canvas = document.createElement("canvas");
    canvas.width = width*scale//svgSize.width * 3;
    canvas.height = height*scale///svgSize.height * 3;
    canvas.style.width = width//svgSize.width;
    canvas.style.height = height//svgSize.height;
    const ctx = canvas.getContext('2d');
    console.log('[ctx]-be',scale,ctx, canvas.getContext)
    ctx.scale(scale, scale);
    console.log('[ctx]-ok',scale, ctx)
    const img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
    // rect.setAttribute("fill", "red")
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        const canvasdata = canvas.toDataURL("image/png", 1);
        const download = document.createElement('a');
        download.href = canvasdata
        download.download = 'map.png';
        download.click();

        callBack()
    };
}